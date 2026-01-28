import { z } from 'zod';

/**
 * Zod schema for an incoming publish event from an authorized publisher.
 */
export const LiveEventPublishSchema = z.object({
  matchId: z.string().min(1),
  type: z.enum(['goal', 'substitution', 'score', 'card', 'other']),
  payload: z.record(z.any()),
  // optional client-side sequence (not used as DB sequence)
  clientSequence: z.number().int().nonnegative().optional(),
});

export type LiveEventPublishDTO = z.infer<typeof LiveEventPublishSchema>;

/**
 * Schema used when emitting events to clients (server-assigned sequence)
 */
export const LiveEventEmitSchema = z.object({
  matchId: z.string(),
  sequence: z.number().int().nonnegative(),
  type: z.enum(['goal', 'substitution', 'score', 'card', 'other']),
  payload: z.record(z.any()),
  timestamp: z.string(),
});

export type LiveEventEmitDTO = z.infer<typeof LiveEventEmitSchema>;