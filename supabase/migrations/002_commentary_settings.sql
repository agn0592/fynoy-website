-- Commentary table (AI-generated portfolio commentary)
CREATE TABLE IF NOT EXISTS public.commentary (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commentary ENABLE ROW LEVEL SECURITY;
-- Admin can insert; all authenticated users can select
CREATE POLICY "commentary: admin can insert" ON public.commentary FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "commentary: authenticated can select" ON public.commentary FOR SELECT USING (auth.uid() IS NOT NULL);

-- Settings table (target sector allocations, etc.)
CREATE TABLE IF NOT EXISTS public.settings (
  key        text    PRIMARY KEY,
  value      jsonb   NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings: admin full access" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "settings: authenticated can select" ON public.settings FOR SELECT USING (auth.uid() IS NOT NULL);
