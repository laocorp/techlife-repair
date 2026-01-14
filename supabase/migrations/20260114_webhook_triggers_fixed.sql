-- =====================================================
-- WEBHOOK SYSTEM - PHASE 4: DATABASE TRIGGERS (CORRECTED)
-- Triggers automáticos para disparar webhooks en eventos
-- VERSIÓN CORREGIDA CON NOMBRES DE COLUMNAS REALES
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
    jsonb_build_object(
      'id', NEW.id,
      'order_number', NEW.order_number,
      'client_id', NEW.client_id,
      'assigned_to', NEW.assigned_to,
      'status', NEW.status,
      'priority', NEW.priority,
      'device_type', NEW.device_type,
      'device_brand', NEW.device_brand,
      'device_model', NEW.device_model,
      'problem_description', NEW.problem_description,
      'estimated_cost', NEW.estimated_cost,
      'received_at', NEW.received_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_work_order_created ON work_orders;
CREATE TRIGGER webhook_work_order_created
  AFTER INSERT ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_work_order_created();

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
        'order_number', NEW.order_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_assigned_to', OLD.assigned_to,
        'new_assigned_to', NEW.assigned_to,
        'device_type', NEW.device_type,
        'device_brand', NEW.device_brand,
        'device_model', NEW.device_model,
        'problem_description', NEW.problem_description,
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
        'order_number', NEW.order_number,
        'device_type', NEW.device_type,
        'device_brand', NEW.device_brand,
        'device_model', NEW.device_model,
        'problem_description', NEW.problem_description,
        'final_cost', NEW.final_cost,
        'completed_at', NEW.completed_at,
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
      jsonb_build_object(
        'id', NEW.id,
        'order_number', NEW.order_number,
        'cancelled_at', NEW.updated_at
      )
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
    jsonb_build_object(
      'id', NEW.id,
      'company_name', NEW.company_name,
      'tax_id', NEW.tax_id,
      'email', NEW.email,
      'phone', NEW.phone,
      'created_at', NEW.created_at
    )
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
      'company_name', NEW.company_name,
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
-- INVOICES: Triggers
-- =====================================================

-- Invoice Created
CREATE OR REPLACE FUNCTION notify_invoice_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM trigger_webhooks(
    NEW.tenant_id,
    'invoice.created',
    jsonb_build_object(
      'id', NEW.id,
      'invoice_number', NEW.invoice_number,
      'client_id', NEW.client_id,
      'work_order_id', NEW.work_order_id,
      'total', NEW.total,
      'due_date', NEW.due_date,
      'status', NEW.status,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_invoice_created ON invoices;
CREATE TRIGGER webhook_invoice_created
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_created();

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
        'invoice_number', NEW.invoice_number,
        'amount', NEW.total,
        'paid_at', NEW.paid_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_invoice_paid ON invoices;
CREATE TRIGGER webhook_invoice_paid
  AFTER UPDATE ON invoices
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION notify_invoice_paid();

-- =====================================================
-- INVENTORY (PRODUCTS): Triggers
-- =====================================================

-- Low Stock Alert
CREATE OR REPLACE FUNCTION notify_inventory_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo disparar cuando cruza el umbral (era mayor, ahora es menor o igual)
  IF NEW.stock_quantity <= NEW.min_stock_level AND OLD.stock_quantity > OLD.min_stock_level THEN
    PERFORM trigger_webhooks(
      NEW.tenant_id,
      'inventory.low_stock',
      jsonb_build_object(
        'product_id', NEW.id,
        'sku', NEW.sku,
        'name', NEW.name,
        'current_stock', NEW.stock_quantity,
        'min_stock', NEW.min_stock_level
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_inventory_low_stock ON products;
CREATE TRIGGER webhook_inventory_low_stock
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.stock_quantity <= NEW.min_stock_level)
  EXECUTE FUNCTION notify_inventory_low_stock();

-- Out of Stock
CREATE OR REPLACE FUNCTION notify_inventory_out_of_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity = 0 AND OLD.stock_quantity > 0 THEN
    PERFORM trigger_webhooks(
      NEW.tenant_id,
      'inventory.out_of_stock',
      jsonb_build_object(
        'product_id', NEW.id,
        'sku', NEW.sku,
        'name', NEW.name
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_inventory_out_of_stock ON products;
CREATE TRIGGER webhook_inventory_out_of_stock
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.stock_quantity = 0)
  EXECUTE FUNCTION notify_inventory_out_of_stock();

-- Product Created
CREATE OR REPLACE FUNCTION notify_product_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM trigger_webhooks(
    NEW.tenant_id,
    'product.created',
    jsonb_build_object(
      'id', NEW.id,
      'sku', NEW.sku,
      'name', NEW.name,
      'unit_price', NEW.unit_price,
      'stock_quantity', NEW.stock_quantity,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_product_created ON products;
CREATE TRIGGER webhook_product_created
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_product_created();

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
      'full_name', NEW.full_name,
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
  action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE 'webhook_%'
ORDER BY event_object_table, trigger_name;
*/
