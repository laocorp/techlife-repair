-- =====================================================
-- WEBHOOK SYSTEM - PHASE 4: DATABASE TRIGGERS
-- Triggers automáticos para disparar webhooks en eventos
-- =====================================================

-- =====================================================
-- ACTUALIZAR función trigger_webhooks
-- Ahora llama a la Edge Function real
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_webhooks(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_data JSONB
) RETURNS void AS $$
DECLARE
  v_webhook RECORD;
  v_function_url TEXT;
  v_response TEXT;
BEGIN
  -- URL de la Edge Function (configurar en Supabase Dashboard)
  -- Settings → Edge Functions → send-webhook
  v_function_url := current_setting('app.supabase_functions_url', true);
  
  IF v_function_url IS NULL OR v_function_url = '' THEN
    RAISE WARNING 'Supabase Functions URL not configured. Set app.supabase_functions_url';
    RETURN;
  END IF;
  
  v_function_url := v_function_url || '/send-webhook';
  
  -- Buscar todos los webhooks activos para este tenant y evento
  FOR v_webhook IN
    SELECT id, url, secret, headers, max_retries
    FROM webhooks
    WHERE tenant_id = p_tenant_id
      AND is_active = true
      AND p_event_type = ANY(events)
  LOOP
    BEGIN
      -- Llamar Edge Function asíncronamente via http extension
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_key', true)
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

COMMENT ON FUNCTION trigger_webhooks IS 'Dispara webhooks activos para un evento específico llamando a la Edge Function';

-- =====================================================
-- WORK ORDERS: Triggers
-- =====================================================

-- Work Order Created
CREATE OR REPLACE FUNCTION notify_work_order_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM trigger_webhooks(
    NEW.tenant_id,
    'work_order.created',
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_work_order_created ON work_orders;
CREATE TRIGGER webhook_work_order_created
  AFTER INSERT ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_work_order_created();

COMMENT ON TRIGGER webhook_work_order_created ON work_orders IS 'Webhook: Dispara evento work_order.created';

-- Work Order Updated
CREATE OR REPLACE FUNCTION notify_work_order_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo disparar si cambió el status o se asignó técnico
  IF OLD.status IS DISTINCT FROM NEW.status OR
     OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    
    PERFORM trigger_webhooks(
      NEW.tenant_id,
      'work_order.updated',
      jsonb_build_object(
        'id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_assigned_to', OLD.assigned_to,
        'new_assigned_to', NEW.assigned_to,
        'device', NEW.device,
        'issue', NEW.issue,
        'updated_at', NEW.updated_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_work_order_updated ON work_orders;
CREATE TRIGGER webhook_work_order_updated
  AFTER UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_work_order_updated();

-- Work Order Completed
CREATE OR REPLACE FUNCTION notify_work_order_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM trigger_webhooks(
      NEW.tenant_id,
      'work_order.completed',
      jsonb_build_object(
        'id', NEW.id,
        'device', NEW.device,
        'issue', NEW.issue,
        'completed_at', NEW.updated_at,
        'assigned_to', NEW.assigned_to
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_work_order_completed ON work_orders;
CREATE TRIGGER webhook_work_order_completed
  AFTER UPDATE ON work_orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION notify_work_order_completed();

-- Work Order Cancelled
CREATE OR REPLACE FUNCTION notify_work_order_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    PERFORM trigger_webhooks(
      NEW.tenant_id,
      'work_order.cancelled',
      row_to_json(NEW)::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_work_order_cancelled ON work_orders;
CREATE TRIGGER webhook_work_order_cancelled
  AFTER UPDATE ON work_orders
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled')
  EXECUTE FUNCTION notify_work_order_cancelled();

-- =====================================================
-- CLIENTS: Triggers
-- =====================================================

-- Client Created
CREATE OR REPLACE FUNCTION notify_client_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM trigger_webhooks(
    NEW.tenant_id,
    'client.created',
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_client_created ON clients;
CREATE TRIGGER webhook_client_created
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_created();

-- Client Updated
CREATE OR REPLACE FUNCTION notify_client_updated()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM trigger_webhooks(
    NEW.tenant_id,
    'client.updated',
    jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'email', NEW.email,
      'phone', NEW.phone,
      'updated_at', NEW.updated_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_client_updated ON clients;
CREATE TRIGGER webhook_client_updated
  AFTER UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_updated();

-- =====================================================
-- INVOICES: Triggers (si la tabla existe)
-- =====================================================

-- Invoice Created
CREATE OR REPLACE FUNCTION notify_invoice_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM trigger_webhooks(
    NEW.tenant_id,
    'invoice.created',
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Solo crear trigger si la tabla invoices existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    DROP TRIGGER IF EXISTS webhook_invoice_created ON invoices;
    CREATE TRIGGER webhook_invoice_created
      AFTER INSERT ON invoices
      FOR EACH ROW
      EXECUTE FUNCTION notify_invoice_created();
  END IF;
END $$;

-- Invoice Paid
CREATE OR REPLACE FUNCTION notify_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM trigger_webhooks(
      NEW.tenant_id,
      'invoice.paid',
      jsonb_build_object(
        'id', NEW.id,
        'amount', NEW.total,
        'paid_at', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    DROP TRIGGER IF EXISTS webhook_invoice_paid ON invoices;
    CREATE TRIGGER webhook_invoice_paid
      AFTER UPDATE ON invoices
      FOR EACH ROW
      WHEN (NEW.status = 'paid')
      EXECUTE FUNCTION notify_invoice_paid();
  END IF;
END $$;

-- =====================================================
-- INVENTORY: Triggers (si la tabla products existe)
-- =====================================================

-- Low Stock Alert
CREATE OR REPLACE FUNCTION notify_inventory_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo disparar cuando cruza el umbral (era mayor, ahora es menor o igual)
  IF NEW.stock <= NEW.min_stock AND OLD.stock > OLD.min_stock THEN
    PERFORM trigger_webhooks(
      NEW.tenant_id,
      'inventory.low_stock',
      jsonb_build_object(
        'product_id', NEW.id,
        'name', NEW.name,
        'current_stock', NEW.stock,
        'min_stock', NEW.min_stock
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    DROP TRIGGER IF EXISTS webhook_inventory_low_stock ON products;
    CREATE TRIGGER webhook_inventory_low_stock
      AFTER UPDATE ON products
      FOR EACH ROW
      WHEN (NEW.stock <= NEW.min_stock)
      EXECUTE FUNCTION notify_inventory_low_stock();
  END IF;
END $$;

-- Out of Stock
CREATE OR REPLACE FUNCTION notify_inventory_out_of_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock = 0 AND OLD.stock > 0 THEN
    PERFORM trigger_webhooks(
      NEW.tenant_id,
      'inventory.out_of_stock',
      jsonb_build_object(
        'product_id', NEW.id,
        'name', NEW.name
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    DROP TRIGGER IF EXISTS webhook_inventory_out_of_stock ON products;
    CREATE TRIGGER webhook_inventory_out_of_stock
      AFTER UPDATE ON products
      FOR EACH ROW
      WHEN (NEW.stock = 0)
      EXECUTE FUNCTION notify_inventory_out_of_stock();
  END IF;
END $$;

-- Product Created
CREATE OR REPLACE FUNCTION notify_product_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM trigger_webhooks(
    NEW.tenant_id,
    'product.created',
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    DROP TRIGGER IF EXISTS webhook_product_created ON products;
    CREATE TRIGGER webhook_product_created
      AFTER INSERT ON products
      FOR EACH ROW
      EXECUTE FUNCTION notify_product_created();
  END IF;
END $$;

-- =====================================================
-- USERS: Triggers
-- =====================================================

-- User Created
CREATE OR REPLACE FUNCTION notify_user_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM trigger_webhooks(
    NEW.tenant_id,
    'user.created',
    jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'role', NEW.role,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_user_created ON users;
CREATE TRIGGER webhook_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_created();

-- User Deactivated
CREATE OR REPLACE FUNCTION notify_user_deactivated()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    PERFORM trigger_webhooks(
      NEW.tenant_id,
      'user.deactivated',
      jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'deactivated_at', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_user_deactivated ON users;
CREATE TRIGGER webhook_user_deactivated
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.is_active = false)
  EXECUTE FUNCTION notify_user_deactivated();

-- =====================================================
-- VERIFICATION QUERY
-- Listar todos los triggers de webhooks creados
-- =====================================================

-- Ejecutar después de la migración para verificar:
/*
SELECT 
  event_object_table as tabla,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'webhook_%'
ORDER BY event_object_table, trigger_name;
*/
