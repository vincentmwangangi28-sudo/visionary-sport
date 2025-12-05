-- Premium Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'pro', 'vip')),
  price_kes INTEGER NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prediction Bundles table
CREATE TABLE public.prediction_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  predictions_count INTEGER NOT NULL,
  price_kes INTEGER NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  coins_earned INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

-- Referral codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily Spin Wheel table
CREATE TABLE public.spin_wheel_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('coins', 'prediction', 'nothing', 'bonus')),
  prize_amount INTEGER DEFAULT 0,
  spun_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prediction Insurance table
CREATE TABLE public.prediction_insurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prediction_id UUID NOT NULL REFERENCES predictions(id),
  insurance_cost INTEGER NOT NULL,
  refund_percent INTEGER DEFAULT 50,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_wheel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_insurance ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prediction Bundles policies (public read)
CREATE POLICY "Anyone can view active bundles" ON public.prediction_bundles FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage bundles" ON public.prediction_bundles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Referrals policies
CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Referral codes policies
CREATE POLICY "Users can view their own code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their code" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can lookup codes" ON public.referral_codes FOR SELECT USING (true);

-- Spin wheel policies
CREATE POLICY "Users can view their spins" ON public.spin_wheel_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create spins" ON public.spin_wheel_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prediction insurance policies
CREATE POLICY "Users can view their insurance" ON public.prediction_insurance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create insurance" ON public.prediction_insurance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their insurance" ON public.prediction_insurance FOR UPDATE USING (auth.uid() = user_id);

-- Insert default prediction bundles
INSERT INTO public.prediction_bundles (name, predictions_count, price_kes, discount_percent) VALUES
('Starter Pack', 5, 200, 0),
('Value Pack', 15, 500, 17),
('Pro Pack', 30, 800, 33),
('Ultimate Pack', 50, 1200, 40);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, UPPER(SUBSTRING(MD5(NEW.id::text || now()::text) FROM 1 FOR 8)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-generate referral code on profile creation
CREATE TRIGGER on_profile_created_generate_referral
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Function to check if user can spin today
CREATE OR REPLACE FUNCTION public.can_spin_today(_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.spin_wheel_entries
    WHERE user_id = _user_id
    AND spun_at::date = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;