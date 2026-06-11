-- ================================================================
-- LIMPIEZA: Eliminar flujo de verificación por email
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- 1. Activar todos los usuarios que hayan quedado como pending_verification
UPDATE public.users 
SET status = 'active', updated_at = NOW() 
WHERE status = 'pending_verification';

-- 2. Eliminar el trigger de confirmación de email (ya no se usa)
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- 3. Eliminar la función asociada al trigger
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ================================================================
-- VERIFICACIÓN: Ejecutar después para confirmar
-- ================================================================

-- Verificar que no quedan usuarios pending_verification
-- SELECT count(*) FROM public.users WHERE status = 'pending_verification';
-- Debería devolver 0
