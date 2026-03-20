
-- ══════════════════════════════════════════
--  ARQUITETO IA — Core Tables Migration
--  Etapa 3: projects, prompts, project_versions, templates, activity_logs
-- ══════════════════════════════════════════

-- ─── TABLE: projects ───────────────────────────────────────────────
CREATE TABLE public.projects (
  id              UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID    NOT NULL,
  title           TEXT    NOT NULL,
  slug            TEXT,
  description     TEXT,
  original_idea   TEXT,
  type            TEXT,
  niche           TEXT,
  complexity      INTEGER DEFAULT 3 CHECK (complexity BETWEEN 1 AND 5),
  platform        TEXT,
  audience        TEXT,
  features        TEXT[]  DEFAULT '{}',
  monetization    TEXT,
  integrations    TEXT[]  DEFAULT '{}',
  status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  quality_score   INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  is_favorite     BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB   DEFAULT '{}',
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_projects_user_id ON public.projects (user_id);
CREATE INDEX idx_projects_status ON public.projects (status);
CREATE INDEX idx_projects_updated_at ON public.projects (updated_at DESC);

-- ─── TABLE: prompts ────────────────────────────────────────────────
CREATE TABLE public.prompts (
  id               UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID    NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id          UUID    NOT NULL,
  type             TEXT    NOT NULL,
  title            TEXT    NOT NULL,
  content          TEXT,
  platform         TEXT,
  version          INTEGER NOT NULL DEFAULT 1,
  tokens_estimate  INTEGER,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompts_select" ON public.prompts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prompts_insert" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prompts_update" ON public.prompts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prompts_delete" ON public.prompts
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prompts_user_id ON public.prompts (user_id);
CREATE INDEX idx_prompts_project_id ON public.prompts (project_id);

-- ─── TABLE: project_versions ───────────────────────────────────────
CREATE TABLE public.project_versions (
  id               UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID    NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number   INTEGER NOT NULL DEFAULT 1,
  snapshot         JSONB   DEFAULT '{}',
  changes_summary  TEXT,
  generated_by_ai  BOOLEAN NOT NULL DEFAULT false,
  ai_observations  TEXT,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- Security definer function to avoid recursive RLS check
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "project_versions_select" ON public.project_versions
  FOR SELECT USING (public.is_project_owner(project_id));
CREATE POLICY "project_versions_insert" ON public.project_versions
  FOR INSERT WITH CHECK (public.is_project_owner(project_id));
CREATE POLICY "project_versions_update" ON public.project_versions
  FOR UPDATE USING (public.is_project_owner(project_id));
CREATE POLICY "project_versions_delete" ON public.project_versions
  FOR DELETE USING (public.is_project_owner(project_id));

CREATE TRIGGER update_project_versions_updated_at
  BEFORE UPDATE ON public.project_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_project_versions_project_id ON public.project_versions (project_id);

-- ─── TABLE: templates ──────────────────────────────────────────────
CREATE TABLE public.templates (
  id             UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  niche          TEXT    NOT NULL,
  title          TEXT    NOT NULL,
  description    TEXT,
  preview_image  TEXT,
  content        JSONB   DEFAULT '{}',
  is_featured    BOOLEAN NOT NULL DEFAULT false,
  usage_count    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Templates são públicos (leitura para todos os autenticados)
CREATE POLICY "templates_select" ON public.templates
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_templates_niche ON public.templates (niche);
CREATE INDEX idx_templates_featured ON public.templates (is_featured);

-- ─── TABLE: activity_logs ──────────────────────────────────────────
CREATE TABLE public.activity_logs (
  id           UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID    NOT NULL,
  project_id   UUID    REFERENCES public.projects(id) ON DELETE SET NULL,
  action       TEXT    NOT NULL,
  entity_type  TEXT,
  entity_id    UUID,
  metadata     JSONB   DEFAULT '{}',
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX idx_activity_logs_project_id ON public.activity_logs (project_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
