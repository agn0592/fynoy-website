-- ============================================================
-- 007_user_features.sql
-- Per-user features: profiles (extension), preferences, watchlist,
-- notifications, audit log.
-- ============================================================

-- ----------------------------------------------------------------
-- Extend public.users with profile fields
-- ----------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_color text DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS bio          text,
  ADD COLUMN IF NOT EXISTS location     text,
  ADD COLUMN IF NOT EXISTS website      text,
  ADD COLUMN IF NOT EXISTS preferences  jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS notifications_read_at timestamptz;

-- ----------------------------------------------------------------
-- watchlist — per-user followed symbols
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.watchlist (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol     text        NOT NULL,
  note       text,
  target_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);
CREATE INDEX IF NOT EXISTS watchlist_user_idx ON public.watchlist (user_id);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watchlist: read own" ON public.watchlist;
CREATE POLICY "watchlist: read own" ON public.watchlist
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "watchlist: insert own" ON public.watchlist;
CREATE POLICY "watchlist: insert own" ON public.watchlist
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "watchlist: update own" ON public.watchlist;
CREATE POLICY "watchlist: update own" ON public.watchlist
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "watchlist: delete own" ON public.watchlist;
CREATE POLICY "watchlist: delete own" ON public.watchlist
  FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- notifications — system-generated notification log
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text,
  href       text,
  data       jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications: read own or broadcast" ON public.notifications;
CREATE POLICY "notifications: read own or broadcast" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid() OR user_id IS NULL OR public.is_admin()
  );

DROP POLICY IF EXISTS "notifications: update own" ON public.notifications;
CREATE POLICY "notifications: update own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications: admin insert" ON public.notifications;
CREATE POLICY "notifications: admin insert" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- ----------------------------------------------------------------
-- audit_log — admin audit trail (system events)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text        NOT NULL,
  target     text,
  detail     jsonb,
  ip         text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON public.audit_log (created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit: admin select" ON public.audit_log;
CREATE POLICY "audit: admin select" ON public.audit_log
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "audit: admin insert" ON public.audit_log;
CREATE POLICY "audit: admin insert" ON public.audit_log
  FOR INSERT WITH CHECK (public.is_admin() OR actor_id = auth.uid());

-- ----------------------------------------------------------------
-- members extra: ensure trigger captures email + name when user signs up
-- (existing trigger keeps these in sync)
-- ----------------------------------------------------------------
