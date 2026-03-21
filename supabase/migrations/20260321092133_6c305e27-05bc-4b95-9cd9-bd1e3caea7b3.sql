CREATE TABLE public.evaluations (
  id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id     UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL,
  overall_score  INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  dimensions     JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary        TEXT,
  top_priorities JSONB DEFAULT '[]'::jsonb,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eval_select" ON public.evaluations
  FOR SELECT USING (public.is_project_owner(project_id));

CREATE POLICY "eval_insert" ON public.evaluations
  FOR INSERT WITH CHECK (public.is_project_owner(project_id));

CREATE INDEX idx_evaluations_project_id ON public.evaluations (project_id);
CREATE INDEX idx_evaluations_user_id ON public.evaluations (user_id);