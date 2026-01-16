-- =====================================================
-- FIX COMPLETO: Permisos para todas las tablas de webhooks
-- Ejecuta esto en Supabase SQL Editor
-- =====================================================

-- TABLA: webhooks (necesita INSERT, SELECT, UPDATE, DELETE)
GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO authenticated;
GRANT ALL ON webhooks TO service_role;

-- TABLA: webhook_logs (necesita SELECT, INSERT)
GRANT SELECT, INSERT ON webhook_logs TO authenticated;
GRANT ALL ON webhook_logs TO service_role;

-- TABLA: webhook_events (necesita solo SELECT - ya está arreglado antes)
GRANT SELECT ON webhook_events TO authenticated;
GRANT ALL ON webhook_events TO service_role;

-- Verificar permisos aplicados
SELECT 
  table_name, 
  grantee, 
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants 
WHERE table_name IN ('webhooks', 'webhook_logs', 'webhook_events')
  AND grantee IN ('authenticated', 'service_role')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- Resultado esperado:
-- webhook_events | authenticated | SELECT
-- webhook_events | service_role  | DELETE, INSERT, SELECT, TRIGGER, TRUNCATE, UPDATE
-- webhook_logs   | authenticated | INSERT, SELECT
-- webhook_logs   | service_role  | DELETE, INSERT, SELECT, TRIGGER, TRUNCATE, UPDATE
-- webhooks       | authenticated | DELETE, INSERT, SELECT, UPDATE
-- webhooks       | service_role  | DELETE, INSERT, SELECT, TRIGGER, TRUNCATE, UPDATE
