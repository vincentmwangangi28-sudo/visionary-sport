-- Create whatsapp_subscriptions table for broadcast opt-ins
CREATE TABLE public.whatsapp_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+254',
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  last_message_sent_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(phone_number)
);

-- Enable RLS
ALTER TABLE public.whatsapp_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own whatsapp subscription"
ON public.whatsapp_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can create own whatsapp subscription"
ON public.whatsapp_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own whatsapp subscription"
ON public.whatsapp_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for efficient querying of active subscriptions
CREATE INDEX idx_whatsapp_subscriptions_active ON public.whatsapp_subscriptions(is_active) WHERE is_active = true;

-- Add updated_at trigger using existing function
CREATE TRIGGER update_whatsapp_subscriptions_updated_at
BEFORE UPDATE ON public.whatsapp_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();