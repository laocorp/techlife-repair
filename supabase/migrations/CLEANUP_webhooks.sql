-- =====================================================
-- LIMPIEZA COMPLETA SISTEMA DE WEBHOOKS
-- Versión mejorada que NO falla si las tablas no existen
-- =====================================================

-- =====================================================
-- 1. ELIMINAR TRIGGERS (usando DO blocks para evitar errores)
-- =====================================================

DO $$ 
BEGIN
    -- Work Orders Triggers
    DROP TRIGGER IF EXISTS webhook_work_order_created ON work_orders;
    DROP TRIGGER IF EXISTS webhook_work_order_updated ON work_orders;
    DROP TRIGGER IF EXISTS webhook_work_order_completed ON work_orders;
    DROP TRIGGER IF EXISTS webhook_work_order_cancelled ON work_orders;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Triggers de work_orders no encontrados (normal si es primera instalación)';
END $$;

DO $$ 
BEGIN
    -- Clients Triggers
    DROP TRIGGER IF EXISTS webhook_client_created ON clients;
    DROP TRIGGER IF EXISTS webhook_client_updated ON clients;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Triggers de clients no encontrados';
END $$;

DO $$ 
BEGIN
    -- Invoices Triggers
    DROP TRIGGER IF EXISTS webhook_invoice_created ON invoices;
    DROP TRIGGER IF EXISTS webhook_invoice_paid ON invoices;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Triggers de invoices no encontrados';
END $$;

DO $$ 
BEGIN
    -- Products/Inventory Triggers
    DROP TRIGGER IF EXISTS webhook_inventory_low_stock ON products;
    DROP TRIGGER IF EXISTS webhook_inventory_out_of_stock ON products;
    DROP TRIGGER IF EXISTS webhook_product_created ON products;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Triggers de products no encontrados';
END $$;

DO $$ 
BEGIN
    -- Users Triggers
    DROP TRIGGER IF EXISTS webhook_user_created ON users;
    DROP TRIGGER IF EXISTS webhook_user_deactivated ON users;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Triggers de users no encontrados';
END $$;

-- =====================================================
-- 2. ELIMINAR FUNCIONES
-- =====================================================

DROP FUNCTION IF EXISTS trigger_webhooks(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS notify_work_order_created();
DROP FUNCTION IF EXISTS notify_work_order_updated();
DROP FUNCTION IF EXISTS notify_work_order_completed();
DROP FUNCTION IF EXISTS notify_work_order_cancelled();
DROP FUNCTION IF EXISTS notify_client_created();
DROP FUNCTION IF EXISTS notify_client_updated();
DROP FUNCTION IF EXISTS notify_invoice_created();
DROP FUNCTION IF EXISTS notify_invoice_paid();
DROP FUNCTION IF EXISTS notify_inventory_low_stock();
DROP FUNCTION IF EXISTS notify_inventory_out_of_stock();
DROP FUNCTION IF EXISTS notify_product_created();
DROP FUNCTION IF EXISTS notify_user_created();
DROP FUNCTION IF EXISTS notify_user_deactivated();

-- =====================================================
-- 3. ELIMINAR TABLAS (con CASCADE para dependencias)
-- =====================================================

DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Limpieza completada exitosamente';
    RAISE NOTICE 'Ahora puedes ejecutar las migraciones en orden:';
    RAISE NOTICE '1. 20260114_webhooks_schema.sql';
    RAISE NOTICE '2. 20260114_webhook_triggers_fixed.sql';
    RAISE NOTICE '3. 20260114_webhook_config_no_superuser.sql';
END $$;

-- =====================================================
-- 4. QUERIES DE VERIFICACIÓN (comentadas)
-- Descomenta y ejecuta estas queries para verificar
-- =====================================================

/*
-- Verificar que no hay tablas de webhooks
SELECT tablename FROM pg_tables 
WHERE tablename IN ('webhooks', 'webhook_logs', 'webhook_events');
-- Debe retornar 0 filas

-- Verificar que no hay triggers de webhooks
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name LIKE 'webhook_%';
-- Debe retornar 0 filas

-- Verificar que no hay funciones de webhooks
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%webhook%' OR routine_name LIKE 'notify_%';
-- Debe retornar 0 filas
*/
