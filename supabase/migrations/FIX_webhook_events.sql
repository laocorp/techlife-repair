-- =====================================================
-- VERIFICACIÓN Y FIX: Webhook Events
-- Ejecuta esto en Supabase SQL Editor
-- =====================================================

-- 1. VERIFICAR: ¿Existen los eventos?
SELECT COUNT(*) as total_eventos FROM webhook_events;
-- Debería mostrar: 17

-- 2. VERIFICAR: ¿Cuáles eventos hay?
SELECT id, category, name FROM webhook_events ORDER BY category, id;

-- 3. VERIFICAR: ¿Está habilitado RLS?
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'webhook_events';
-- rowsecurity debería ser 't' (true)

-- 4. VERIFICAR: ¿Qué políticas existen?
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'webhook_events';

-- =====================================================
-- FIX: Si no hay eventos, insertarlos
-- =====================================================
INSERT INTO webhook_events (id, category, name, description, payload_example) VALUES
  -- Órdenes de Trabajo
  ('work_order.created', 'work_orders', 'Orden Creada', 'Nueva orden de trabajo creada', 
   '{"id": "uuid", "client_name": "Juan Pérez", "device": "iPhone 13", "issue": "Pantalla rota"}'),
  ('work_order.updated', 'work_orders', 'Orden Actualizada', 'Orden actualizada (cambio de estado o técnico)',
   '{"id": "uuid", "status": "in_progress", "assigned_to": "uuid"}'),
  ('work_order.completed', 'work_orders', 'Orden Completada', 'Orden de trabajo completada',
   '{"id": "uuid", "completed_at": "2026-01-13T20:00:00Z"}'),
  ('work_order.cancelled', 'work_orders', 'Orden Cancelada', 'Orden cancelada',
   '{"id": "uuid", "cancelled_reason": "Cliente canceló"}'),
  
  -- Clientes
  ('client.created', 'clients', 'Cliente Creado', 'Nuevo cliente registrado en el sistema',
   '{"id": "uuid", "name": "María García", "email": "maria@email.com", "phone": "+593999999999"}'),
  ('client.updated', 'clients', 'Cliente Actualizado', 'Información de cliente modificada',
   '{"id": "uuid", "updated_fields": ["email", "phone"]}'),
  
  -- Facturas
  ('invoice.created', 'invoices', 'Factura Creada', 'Nueva factura generada',
   '{"id": "uuid", "client_id": "uuid", "total": 100.00, "due_date": "2026-01-20"}'),
  ('invoice.paid', 'invoices', 'Factura Pagada', 'Factura marcada como pagada',
   '{"id": "uuid", "paid_at": "2026-01-13T20:00:00Z", "amount": 100.00}'),
  ('invoice.overdue', 'invoices', 'Factura Vencida', 'Factura pasó su fecha de vencimiento',
   '{"id": "uuid", "due_date": "2026-01-10", "days_overdue": 3}'),
  
  -- Inventario
  ('inventory.low_stock', 'inventory', 'Stock Bajo', 'Producto alcanzó el nivel mínimo de stock',
   '{"product_id": "uuid", "name": "Pantalla iPhone 13", "current_stock": 3, "min_stock": 5}'),
  ('inventory.out_of_stock', 'inventory', 'Sin Stock', 'Producto agotado',
   '{"product_id": "uuid", "name": "Batería Samsung S21"}'),
  ('product.created', 'inventory', 'Producto Creado', 'Nuevo producto agregado al inventario',
   '{"id": "uuid", "name": "Cable USB-C", "price": 15.00, "stock": 50}'),
  
  -- Pagos & Suscripciones
  ('payment.completed', 'payments', 'Pago Completado', 'Pago de suscripción procesado exitosamente',
   '{"transaction_id": "uuid", "amount": 59.00, "plan": "Professional"}'),
  ('payment.failed', 'payments', 'Pago Fallido', 'Fallo en el procesamiento del pago',
   '{"transaction_id": "uuid", "error": "insufficient_funds"}'),
  ('subscription.expiring', 'subscriptions', 'Suscripción por Vencer', 'Suscripción vence pronto',
   '{"tenant_id": "uuid", "expires_at": "2026-01-20", "days_until_expiry": 7}'),
  
  -- Usuarios
  ('user.created', 'users', 'Usuario Creado', 'Nuevo miembro agregado al equipo',
   '{"id": "uuid", "email": "tecnico@empresa.com", "role": "technician"}'),
  ('user.deactivated', 'users', 'Usuario Desactivado', 'Usuario fue desactivado',
   '{"id": "uuid", "email": "antiguo@empresa.com", "deactivated_at": "2026-01-13T20:00:00Z"}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FIX: Asegurar que la política RLS permita lectura
-- =====================================================

-- Eliminar política antigua si existe
DROP POLICY IF EXISTS "Anyone can view webhook events" ON webhook_events;

-- Crear política que permita a usuarios autenticados leer eventos
CREATE POLICY "Authenticated users can view webhook events"
  ON webhook_events FOR SELECT
  TO authenticated
  USING (true);

-- También permitir a anon (por si acaso)
CREATE POLICY "Anon can view webhook events"
  ON webhook_events FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
SELECT 
  id, 
  category, 
  name,
  is_active
FROM webhook_events 
WHERE is_active = true
ORDER BY category, name;

-- Deberías ver 17 eventos activos
