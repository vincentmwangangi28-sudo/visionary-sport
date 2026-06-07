-- Enable RLS on realtime.messages to gate channel subscriptions and broadcasts
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior Lovable-managed policies so this migration is idempotent
DROP POLICY IF EXISTS "Authenticated users can subscribe to own channels" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can broadcast to own channels" ON realtime.messages;

-- Allow authenticated users to receive messages only on channels whose topic
-- begins with their auth.uid() (convention: "<user_id>:<channel-name>").
CREATE POLICY "Authenticated users can subscribe to own channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE (auth.uid()::text || ':%')
);

-- Allow authenticated users to broadcast/presence-write only to their own channels.
CREATE POLICY "Authenticated users can broadcast to own channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE (auth.uid()::text || ':%')
);