-- ============================================================
-- 008_secure_definer_functions.sql
-- Close the PostgREST RPC exposure on SECURITY DEFINER functions
-- that are only meant to fire from triggers / RLS policies.
-- ============================================================

-- handle_new_user fires from the on_auth_user_created trigger on
-- auth.users. Supabase Auth (GoTrue) inserts under supabase_auth_admin
-- which inherits from service_role, so the trigger keeps working.
-- anon and authenticated should not be able to call it via RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- rls_auto_enable is an event trigger function fired on DDL.
-- Not meant to be callable via RPC.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

-- Switch is_admin from SECURITY DEFINER to SECURITY INVOKER.
-- The "users: read own row" RLS policy lets the calling user see
-- their own row, which is all is_admin needs. Behavior is identical;
-- the advisor warning goes away.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
