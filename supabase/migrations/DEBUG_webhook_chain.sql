-- =====================================================
-- DIAGNÓSTICO: ¿Por qué no llega el webhook?
-- Ejecuta esto en Supabase SQL Editor
-- =====================================================

-- 1. Verificar si la extensión pg_net está activa
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 2. Verificar si el webhook está activo y tiene el evento correcto
SELECT id, name, url, events, is_active, created_by 
FROM webhooks 
ORDER BY created_at DESC LIMIT 1;

-- 3. Ver cola de peticiones HTTP (¿Salió de la base de datos?)
-- Si esta tabla está vacía, el trigger no se disparó o pg_net no funcionó
SELECT id, url, status_code, error_msg, created 
FROM net.http_request_queue 
ORDER BY id DESC LIMIT 5;

-- 4. Ver logs internos (¿Llegó a la Edge Function?)
-- Si la Edge Function corrió, debió insertar aquí
SELECT * FROM webhook_logs 
ORDER BY created_at DESC LIMIT 5;

-- 5. Simular disparo manual (Test directo a pg_net)
-- Esto intenta llamar a tu Edge Function manualmente para ver si devuelve error
SELECT net.http_post(
    url := 'https://lztnncxlomdhjelqziuh.supabase.co/functions/v1/send-webhook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer PEGAR_TU_KEY_AQUI_SI_QUIERES_PROBAR_MANUAL"}'::jsonb,
    body := '{"test": true}'::jsonb
);
