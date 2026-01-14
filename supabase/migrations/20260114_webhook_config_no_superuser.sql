-- =====================================================
-- WEBHOOK CONFIGURATION - ALTERNATIVE (NO SUPERUSER REQUIRED)
-- Para usuarios sin permisos ALTER DATABASE
-- =====================================================

-- Función actualizada que NO requiere database settings
CREATE OR REPLACE FUNCTION trigger_webhooks(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_data JSONB
) RETURNS void AS $$
DECLARE
  v_webhook RECORD;
  v_function_url TEXT;
BEGIN
  -- HARDCODED: Reemplaza con tu project URL
  v_function_url := 'https://lztnncxlomdhjelqziuh.supabase.co/functions/v1/send-webhook';
  
  -- Buscar todos los webhooks activos para este tenant y evento
  FOR v_webhook IN
    SELECT id, url, secret, headers, max_retries
    FROM webhooks
    WHERE tenant_id = p_tenant_id
      AND is_active = true
      AND p_event_type = ANY(events)
  LOOP
    BEGIN
      -- Llamar Edge Function usando la extensión http
      -- NOTA: La autenticación se maneja dentro de la Edge Function
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'webhook_id', v_webhook.id,
          'webhook_url', v_webhook.url,
          'webhook_secret', v_webhook.secret,
          'webhook_headers', v_webhook.headers,
          'max_retries', COALESCE(v_webhook.max_retries, 3),
          'event_type', p_event_type,
          'tenant_id', p_tenant_id,
          'data', p_data
        )
      );
      
      RAISE DEBUG 'Webhook triggered: % for event %', v_webhook.id, p_event_type;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error calling webhook %: %', v_webhook.id, SQLERRM;
    END;
  END LOOP;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_webhooks IS 'Dispara webhooks sin requerir database settings (compatible con Supabase Cloud)';
