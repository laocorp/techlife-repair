-- RepairApp v2 - Additional Triggers and Functions
-- Run this after 001_initial_schema.sql

-- =============================================
-- FUNCIÓN: Crear cuenta cliente automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION create_client_account()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Only create account if email is provided and user_id is null
  IF NEW.email IS NOT NULL AND NEW.user_id IS NULL THEN
    -- Check if user already exists
    SELECT id INTO new_user_id FROM auth.users WHERE email = NEW.email;
    
    IF new_user_id IS NULL THEN
      -- User doesn't exist, we'll need to handle this differently
      -- The actual magic link invitation should be sent via Edge Function
      RAISE NOTICE 'Client account should be created for email: %', NEW.email;
    ELSE
      -- User exists, link it
      NEW.user_id := new_user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_client_account
  BEFORE INSERT ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION create_client_account();

-- =============================================
-- FUNCIÓN: Auto-generar número de factura
-- =============================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  empresa RECORD;
  next_num INTEGER;
  fecha_actual DATE;
BEGIN
  -- Get empresa config
  SELECT establecimiento, punto_emision INTO empresa
  FROM empresas WHERE id = NEW.empresa_id;
  
  fecha_actual := CURRENT_DATE;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_factura, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM ventas
  WHERE empresa_id = NEW.empresa_id
    AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM fecha_actual);
  
  -- Format: 001-001-000000001
  NEW.numero_factura := COALESCE(empresa.establecimiento, '001') || '-' ||
                        COALESCE(empresa.punto_emision, '001') || '-' ||
                        LPAD(next_num::TEXT, 9, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON ventas
  FOR EACH ROW
  WHEN (NEW.numero_factura IS NULL OR NEW.numero_factura = '')
  EXECUTE FUNCTION generate_invoice_number();

-- =============================================
-- FUNCIÓN: Actualizar stock al vender
-- =============================================
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease stock when sale detail is created
  IF TG_OP = 'INSERT' THEN
    UPDATE productos
    SET stock = stock - NEW.cantidad
    WHERE id = NEW.producto_id;
    RETURN NEW;
  END IF;
  
  -- Handle updates (adjust difference)
  IF TG_OP = 'UPDATE' THEN
    UPDATE productos
    SET stock = stock + OLD.cantidad - NEW.cantidad
    WHERE id = NEW.producto_id;
    RETURN NEW;
  END IF;
  
  -- Restore stock on delete
  IF TG_OP = 'DELETE' THEN
    UPDATE productos
    SET stock = stock + OLD.cantidad
    WHERE id = OLD.producto_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_stock
  AFTER INSERT OR UPDATE OR DELETE ON ventas_detalle
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();

-- =============================================
-- FUNCIÓN: Registrar movimiento de caja en venta
-- =============================================
CREATE OR REPLACE FUNCTION register_cash_movement_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  caja_actual UUID;
BEGIN
  -- Find open cash register for this empresa
  SELECT id INTO caja_actual
  FROM caja
  WHERE empresa_id = NEW.empresa_id
    AND estado = 'abierta'
  ORDER BY fecha_apertura DESC
  LIMIT 1;
  
  IF caja_actual IS NOT NULL THEN
    INSERT INTO caja_movimientos (caja_id, tipo, concepto, monto, venta_id)
    VALUES (caja_actual, 'ingreso', 'Venta ' || NEW.numero_factura, NEW.total, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_cash_movement_on_sale
  AFTER INSERT ON ventas
  FOR EACH ROW
  EXECUTE FUNCTION register_cash_movement_on_sale();

-- =============================================
-- FUNCIÓN: Historial de cambios en órdenes
-- =============================================
CREATE TABLE IF NOT EXISTS ordenes_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  estado_anterior VARCHAR(20),
  estado_nuevo VARCHAR(20),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ordenes_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order history from their company" ON ordenes_historial
  FOR SELECT USING (
    orden_id IN (SELECT id FROM ordenes_servicio WHERE empresa_id = get_user_empresa_id())
  );

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO ordenes_historial (orden_id, estado_anterior, estado_nuevo)
    VALUES (NEW.id, OLD.estado, NEW.estado);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_order_changes
  AFTER UPDATE ON ordenes_servicio
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- =============================================
-- FUNCIÓN: Calcular totales de venta
-- =============================================
CREATE OR REPLACE FUNCTION calculate_sale_totals()
RETURNS TRIGGER AS $$
DECLARE
  calc_subtotal DECIMAL(10,2);
  calc_iva DECIMAL(10,2);
BEGIN
  -- Calculate from details
  SELECT 
    COALESCE(SUM(subtotal), 0),
    COALESCE(SUM(iva), 0)
  INTO calc_subtotal, calc_iva
  FROM ventas_detalle
  WHERE venta_id = NEW.venta_id;
  
  -- Update venta totals
  UPDATE ventas
  SET subtotal = calc_subtotal,
      iva = calc_iva,
      total = calc_subtotal + calc_iva
  WHERE id = NEW.venta_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_sale_totals
  AFTER INSERT OR UPDATE OR DELETE ON ventas_detalle
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sale_totals();

-- =============================================
-- FUNCIONES RPC ÚTILES
-- =============================================

-- Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_empresa_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'ordenes_activas', (SELECT COUNT(*) FROM ordenes_servicio WHERE empresa_id = p_empresa_id AND estado NOT IN ('entregado')),
    'ordenes_hoy', (SELECT COUNT(*) FROM ordenes_servicio WHERE empresa_id = p_empresa_id AND DATE(created_at) = CURRENT_DATE),
    'ventas_hoy', (SELECT COALESCE(SUM(total), 0) FROM ventas WHERE empresa_id = p_empresa_id AND DATE(fecha) = CURRENT_DATE),
    'ventas_mes', (SELECT COALESCE(SUM(total), 0) FROM ventas WHERE empresa_id = p_empresa_id AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)),
    'clientes_total', (SELECT COUNT(*) FROM clientes WHERE empresa_id = p_empresa_id),
    'clientes_nuevos_mes', (SELECT COUNT(*) FROM clientes WHERE empresa_id = p_empresa_id AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)),
    'productos_stock_bajo', (SELECT COUNT(*) FROM productos WHERE empresa_id = p_empresa_id AND stock <= stock_minimo AND activo = true),
    'pagos_pendientes', (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE empresa_id = p_empresa_id AND estado = 'pendiente')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get order timeline
CREATE OR REPLACE FUNCTION get_order_timeline(p_orden_id UUID)
RETURNS TABLE (
  id UUID,
  estado_anterior VARCHAR(20),
  estado_nuevo VARCHAR(20),
  comentario TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT h.id, h.estado_anterior, h.estado_nuevo, h.comentario, h.created_at
  FROM ordenes_historial h
  WHERE h.orden_id = p_orden_id
  ORDER BY h.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search products
CREATE OR REPLACE FUNCTION search_products(
  p_empresa_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  codigo VARCHAR(50),
  nombre TEXT,
  precio DECIMAL(10,2),
  stock INTEGER,
  tipo VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.codigo, p.nombre, p.precio, p.stock, p.tipo
  FROM productos p
  WHERE p.empresa_id = p_empresa_id
    AND p.activo = true
    AND (
      p.nombre ILIKE '%' || p_query || '%'
      OR p.codigo ILIKE '%' || p_query || '%'
    )
  ORDER BY p.nombre
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_timeline(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products(UUID, TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION get_dashboard_stats IS 'Obtiene estadísticas del dashboard para una empresa';
COMMENT ON FUNCTION get_order_timeline IS 'Obtiene el historial de cambios de estado de una orden';
COMMENT ON FUNCTION search_products IS 'Busca productos por nombre o código';
