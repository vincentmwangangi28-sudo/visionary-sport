-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'premium');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  coins INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  league TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  prediction TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT NOT NULL,
  ai_model TEXT DEFAULT 'google/gemini-2.5-flash',
  is_premium BOOLEAN DEFAULT false,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Create user_predictions table (user's own predictions/bets)
CREATE TABLE public.user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE NOT NULL,
  user_choice TEXT NOT NULL,
  coins_wagered INTEGER DEFAULT 0,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_predictions ENABLE ROW LEVEL SECURITY;

-- Create contests table
CREATE TABLE public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  entry_fee INTEGER DEFAULT 0 NOT NULL,
  prize_pool INTEGER DEFAULT 0 NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

-- Create contest_entries table
CREATE TABLE public.contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(contest_id, user_id)
);

ALTER TABLE public.contest_entries ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('coin_purchase', 'subscription', 'contest_entry', 'prediction_cost', 'winnings')),
  amount INTEGER NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('stripe', 'mpesa', 'coins')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for predictions
CREATE POLICY "Anyone can view free predictions"
  ON public.predictions FOR SELECT
  USING (is_premium = false OR public.has_role(auth.uid(), 'premium') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update predictions"
  ON public.predictions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_predictions
CREATE POLICY "Users can view their own predictions"
  ON public.user_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own predictions"
  ON public.user_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for contests
CREATE POLICY "Anyone can view active contests"
  ON public.contests FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage contests"
  ON public.contests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for contest_entries
CREATE POLICY "Users can view contest entries"
  ON public.contest_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own contest entries"
  ON public.contest_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);