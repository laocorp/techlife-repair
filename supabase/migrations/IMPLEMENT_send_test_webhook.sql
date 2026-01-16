-- =====================================================
-- FUNCIÓN: send_test_webhook
-- Permite probar un webhook específico enviando un payload de prueba
-- =====================================================

CREATE OR REPLACE FUNCTION send_test_webhook(
  p_webhook_id UUID
) RETURNS jsonb AS $$
DECLARE
  v_url TEXT;
  v_secret TEXT;
  v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dG5uY3hsb21kaGplbHF6aXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIwMjcxOSwiZXhwIjoyMDgxNzc4NzE5fQ.1rgZ42RivZXQpis8D0VR_dTPhTkQM69jrEhMgboRgaM';
  v_edge_function_url TEXT := 'https://lztnncxlomdhjelqziuh.supabase.co/functions/v1/send-webhook';
  v_request_id BIGINT;
BEGIN
  -- 1. Obtener datos del webhook
  SELECT url, secret INTO v_url, v_secret
  FROM webhooks
  WHERE id = p_webhook_id;

  IF v_url IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Webhook not found');
  END IF;

  -- 2. Enviar a la Edge Function
  SELECT net.http_post(
    url := v_edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'webhook_id', p_webhook_id,
      'event_type', 'test',
      'payload', jsonb_build_object(
        'message', 'Hello from TechRepair! This is a test event.',
        'timestamp', now(),
        'test', true
      )
    )
  ) INTO v_request_id;

  -- 3. Registrar el intento en logs (La Edge Function insertará también, pero esto es feedback inmediato)
  INSERT INTO webhook_logs (
    webhook_id, 
    event_type, 
    payload, 
    request_url, 
    status_code, 
    response_body
  ) VALUES (
    p_webhook_id,
    'test',
    jsonb_build_object('test', true, 'note', 'Triggered manually via Test Button'),
    v_url,
    202, -- Accepted (Async)
    'Sent to Edge Function (Queue ID: ' || v_request_id || ')'
  );

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
