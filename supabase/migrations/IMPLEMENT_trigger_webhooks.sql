-- =====================================================
-- IMPLEMENTACIÓN FINAL: trigger_webhooks
-- Requiere extensión pg_net para hacer llamadas HTTP
-- =====================================================

-- 1. Habilitar extensión para networking
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Función que dispara el webhook
CREATE OR REPLACE FUNCTION trigger_webhooks(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_data JSONB
) RETURNS void AS $$
DECLARE
  -- URL de tu Edge Function
  v_url TEXT := 'https://lztnncxlomdhjelqziuh.supabase.co/functions/v1/send-webhook';
  
  -- ⚠️ IMPORTANTE: REEMPLAZA ESTO CON TU SERVICE ROLE KEY ⚠️
  -- La encuentras en: Supabase Dashboard -> Settings -> API -> service_role (secret)
  v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dG5uY3hsb21kaGplbHF6aXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIwMjcxOSwiZXhwIjoyMDgxNzc4NzE5fQ.1rgZ42RivZXQpis8D0VR_dTPhTkQM69jrEhMgboRgaM';
  
  -- Variables internas
  v_webhook_id UUID;
BEGIN
  -- Solo disparamos si hay webhooks activos para este evento
  -- Iteramos por cada webhook activo que coincida
  FOR v_webhook_id IN
    SELECT id 
    FROM webhooks 
    WHERE tenant_id = p_tenant_id 
      AND is_active = true 
      AND p_event_type = ANY(events)
  LOOP
    -- Llamada Async a la Edge Function
    -- La Edge Function se encargará de reintentos, logs y seguridad
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'webhook_id', v_webhook_id,
        'event_type', p_event_type,
        'payload', p_data
      )
    );
  END LOOP;
    
EXCEPTION WHEN OTHERS THEN
  -- Log error en consola de Postgres pero no fallar transacción
  RAISE WARNING 'Error triggering webhook for tenant %: %', p_tenant_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
