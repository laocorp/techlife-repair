-- =====================================================
-- DIAGNÓSTICO V2: Simplificado
-- =====================================================

-- 1. Ver qué columnas tiene realmente la cola
SELECT * FROM net.http_request_queue LIMIT 1;

-- 2. Ver si la extensión está activa
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_net';

-- 3. Ver los últimos 3 webhooks creados y revisar sus eventos
SELECT name, url, events, is_active FROM webhooks ORDER BY created_at DESC LIMIT 3;
