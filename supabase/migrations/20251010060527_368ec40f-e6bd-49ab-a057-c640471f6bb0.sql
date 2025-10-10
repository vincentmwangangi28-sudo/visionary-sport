-- Reload schema cache by adding a comment to trigger schema update
COMMENT ON TABLE public.contest_entries IS 'Contest entries with user scores';
COMMENT ON TABLE public.profiles IS 'User profile information';

-- Ensure the foreign key constraint exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contest_entries_user_id_fkey'
  ) THEN
    ALTER TABLE public.contest_entries 
    ADD CONSTRAINT contest_entries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;