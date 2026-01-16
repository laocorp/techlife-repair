-- =====================================================
-- FIX: Permisos de tabla webhook_events
-- El error "permission denied for table" es de GRANT, no de RLS
-- Ejecuta esto en Supabase SQL Editor
-- =====================================================

-- 1. Otorgar permisos SELECT a usuarios autenticados
GRANT SELECT ON webhook_events TO authenticated;

-- 2. También otorgar a anon por si acaso
GRANT SELECT ON webhook_events TO anon;

-- 3. Asegurar que el service_role también tenga todos los permisos
GRANT ALL ON webhook_events TO service_role;

-- 4. Verificar que los permisos se aplicaron
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'webhook_events';

-- 5. Test final - debería retornar 17 eventos
SELECT COUNT(*) as total FROM webhook_events;
