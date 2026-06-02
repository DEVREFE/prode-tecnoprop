-- Ejecutar en el SQL Editor de Supabase para arreglar el error de recursión infinita (500 Internal Server Error)

-- 1. Crear función SECURITY DEFINER para verificar membresía sin disparar RLS recursivamente
CREATE OR REPLACE FUNCTION public.is_league_member(p_league_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.league_members
    WHERE league_id = p_league_id AND user_id = auth.uid()
  );
$$;

-- 2. Borrar las políticas problemáticas
DROP POLICY IF EXISTS "ver_miembros" ON public.league_members;
DROP POLICY IF EXISTS "ver_ligas_publicas" ON public.leagues;

-- 3. Recrear la política en league_members usando la función
CREATE POLICY "ver_miembros" ON public.league_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.is_league_member(league_id)
  );

-- 4. Recrear la política en leagues usando la función
CREATE POLICY "ver_ligas_publicas" ON public.leagues
  FOR SELECT USING (
    is_public = TRUE OR 
    owner_id = auth.uid() OR
    public.is_league_member(id)
  );
