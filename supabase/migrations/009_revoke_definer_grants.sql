-- ============================================================
-- 009_revoke_definer_grants.sql
-- The 008 REVOKE on PUBLIC was not enough because the migration
-- defaults grant EXECUTE explicitly to anon/authenticated/postgres/
-- service_role. Revoke from the two roles PostgREST exposes.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
