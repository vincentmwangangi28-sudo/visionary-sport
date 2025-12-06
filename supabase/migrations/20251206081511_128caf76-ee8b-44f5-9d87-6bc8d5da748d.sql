-- Enable realtime for tables not yet added
DO $$
BEGIN
  -- contests
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'contests'
  ) THEN
    ALTER TABLE public.contests REPLICA IDENTITY FULL;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contests;
  END IF;
  
  -- contest_entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'contest_entries'
  ) THEN
    ALTER TABLE public.contest_entries REPLICA IDENTITY FULL;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_entries;
  END IF;
  
  -- transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER TABLE public.transactions REPLICA IDENTITY FULL;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
  
  -- spin_wheel_entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'spin_wheel_entries'
  ) THEN
    ALTER TABLE public.spin_wheel_entries REPLICA IDENTITY FULL;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.spin_wheel_entries;
  END IF;

  -- profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER TABLE public.profiles REPLICA IDENTITY FULL;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;