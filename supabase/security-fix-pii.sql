-- ================================================================
-- SECURITY FIX — Fuga de datos personales (PII) en public.users
-- ================================================================
-- PROBLEMA:
--   La política "perfiles_publicos" usaba USING (TRUE), lo que permitía
--   que CUALQUIERA con la anon key (que es pública, va en el bundle del
--   navegador) leyera la tabla users COMPLETA: email, whatsapp,
--   instagram, ciudad y referral_code de todos los participantes.
--
-- SOLUCIÓN:
--   1. users: lectura solo de la propia fila (+ admins).
--   2. Los datos públicos (ranking, landing) salen de la vista
--      ranking_general, que NO expone email/whatsapp y a la que ahora
--      también le quitamos referral_code.
--   3. El registro (usuario anónimo) verifica unicidad de Instagram y
--      resuelve el código de referido vía funciones SECURITY DEFINER,
--      sin necesidad de leer la tabla directamente.
--
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ================================================================

-- ── 1. Helper: ¿el usuario actual es admin? ──────────────────────
-- SECURITY DEFINER → no dispara RLS recursivamente sobre users.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── 2. Reemplazar la política abierta por una de fila propia ─────
DROP POLICY IF EXISTS "perfiles_publicos" ON public.users;
-- admin_lee_todo (de schema-fase3.sql) usa una subconsulta recursiva
-- sobre users que puede causar recursión RLS; la cubrimos con is_admin().
DROP POLICY IF EXISTS "admin_lee_todo" ON public.users;

CREATE POLICY "leer_perfil_propio" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- ── 3. Recrear ranking_general SIN referral_code ────────────────
-- La vista corre con privilegios del owner (postgres), por lo que
-- sigue sirviendo el ranking público sin exponer la tabla users.
-- DROP + CREATE: CREATE OR REPLACE no permite quitar columnas existentes.
DROP VIEW IF EXISTS public.ranking_general;
CREATE VIEW public.ranking_general AS
SELECT
  u.id,
  u.nombre,
  u.apellido,
  u.ciudad,
  u.instagram_handle,
  u.total_points,
  ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) AS position,
  COUNT(p.id) FILTER (WHERE p.points_earned = 3) AS exact_results,
  COUNT(p.id) FILTER (WHERE p.points_earned > 0) AS correct_results,
  COUNT(p.id) FILTER (WHERE p.points_earned IS NOT NULL) AS total_predicted
FROM public.users u
LEFT JOIN public.predictions p ON p.user_id = u.id
WHERE u.status = 'active'
GROUP BY u.id;

GRANT SELECT ON public.ranking_general TO anon, authenticated;

-- ── 4. Funciones para el registro (usuario anónimo) ─────────────
-- 4a. ¿Está disponible este handle de Instagram?
CREATE OR REPLACE FUNCTION public.instagram_disponible(p_handle TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE instagram_handle = lower(trim(p_handle))
  );
$$;

-- 4b. Resolver el id del usuario que refirió, a partir de su código.
CREATE OR REPLACE FUNCTION public.resolver_referido(p_code TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.users
  WHERE referral_code = p_code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.instagram_disponible(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_referido(TEXT)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()                TO authenticated;
