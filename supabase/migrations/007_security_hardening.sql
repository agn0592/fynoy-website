-- ============================================================
-- 007_security_hardening.sql
-- Pin search_path on SECURITY DEFINER functions to prevent
-- search_path-based privilege escalation. Without this, any role
-- with CREATE privilege on a schema in its search_path could
-- shadow built-in functions used inside the definer functions.
-- ============================================================

ALTER FUNCTION public.set_updated_at()  SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.is_admin()        SET search_path = 'public';
