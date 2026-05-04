CREATE TABLE IF NOT EXISTS public.job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('success','partial','failed','skipped')),
  eat_date date NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  processed integer DEFAULT 0,
  total_markets integer DEFAULT 0,
  error text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_job_runs_name_eat_date ON public.job_runs (job_name, eat_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_runs_started_at ON public.job_runs (started_at DESC);

ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view job runs"
ON public.job_runs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));