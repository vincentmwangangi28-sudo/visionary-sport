import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { LiveEventPublishSchema, LiveEventEmitSchema, LiveEventEmitDTO } from './schemas';
import * as repository from './repository';
import { verifyToken, isPublisher } from './auth';

const app = express();
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: { origin: '*' },
});

// Namespace for live match events
const nsp = io.of('/live');

nsp.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token required'));
    const user = verifyToken(token);
    // attach user to socket
    (socket as any).user = user;
    return next();
  } catch (err) {
    return next(new Error('Authentication failed'));\n  }
});

nsp.on('connection', (socket) => {
  const user = (socket as any).user;

  socket.on('subscribe', async (data: { matchId: string; sinceSequence?: number }) => {
    try {
      const { matchId, sinceSequence } = data;
      socket.join(`match:${matchId}`);

      // Replay missed events if client provided sinceSequence
      if (typeof sinceSequence === 'number') {
        const missed = await repository.getEventsSince(matchId, sinceSequence);
        missed.forEach((evt) => socket.emit('event', evt));
      }

      socket.emit('subscribed', { matchId });
    } catch (err) {
      socket.emit('error', { message: 'Failed to subscribe' });
    }
  });

  socket.on('publish:event', async (raw) => {
    try {
      if (!isPublisher(user)) {
        socket.emit('error', { message: 'Insufficient permissions to publish events' });
        return;
      }

      const parse = LiveEventPublishSchema.safeParse(raw);
      if (!parse.success) {
        socket.emit('error', { message: 'Invalid event payload', details: parse.error.format() });
        return;
      }

      const { matchId, type, payload } = parse.data;

      // persist event and get server-assigned sequence
      const saved = await repository.saveEvent(matchId, type, payload, user.id);

      const emitPayload: LiveEventEmitDTO = {
        matchId,
        sequence: saved.sequence,
        type,
        payload,
        timestamp: saved.timestamp,
      };

      // emit to room
      nsp.to(`match:${matchId}`).emit('event', emitPayload);
      // ack to publisher
      socket.emit('published', { sequence: saved.sequence });
    } catch (err) {
      socket.emit('error', { message: 'Failed to publish event' });
    }
  });

  socket.on('disconnect', () => {
    // cleanup handled by socket.io
  });
});

export function listen(port = Number(process.env.PORT) || 4000) {
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Realtime server listening on port ${port}`);
  });
}

// If run directly
if (require.main === module) {
  listen();
}