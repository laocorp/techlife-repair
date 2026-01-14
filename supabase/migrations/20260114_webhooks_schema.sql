-- =====================================================
-- WEBHOOK AUTOMATION SYSTEM - PHASE 1: DATABASE SCHEMA
-- =====================================================
-- Este sistema permite automatizar flujos de trabajo con n8n
-- mediante webhooks que se disparan automáticamente en eventos
-- del sistema (nueva orden, cliente creado, factura pagada, etc.)
-- =====================================================

-- Habilitar extensión HTTP para llamar Edge Functions
CREATE EXTENSION IF NOT EXISTS "http";

-- =====================================================
-- TABLA: webhooks
-- Configuración de webhooks por tenant
-- =====================================================
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Configuración básica
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  secret TEXT, -- Secret para validar HMAC signatures
  
  -- Eventos a los que está suscrito (array de strings)
  events TEXT[] NOT NULL DEFAULT '{}',
  
  -- Headers personalizados HTTP (JSON key-value)
  headers JSONB DEFAULT '{}',
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Configuración de reintentos
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 5,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints de validación
  CONSTRAINT valid_url CHECK (url ~* '^https?://'),
  CONSTRAINT events_not_empty CHECK (array_length(events, 1) > 0)
);

-- Indexes para performance
CREATE INDEX idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active) WHERE is_active = true;
CREATE INDEX idx_webhooks_events ON webhooks USING GIN(events);

-- Comentarios para documentación
COMMENT ON TABLE webhooks IS 'Configuración de webhooks por tenant para automatización con n8n';
COMMENT ON COLUMN webhooks.secret IS 'Secret key para generar y validar firmas HMAC';
COMMENT ON COLUMN webhooks.events IS 'Array de tipos de eventos (ej: ["work_order.created", "client.created"])';
COMMENT ON COLUMN webhooks.headers IS 'Headers HTTP personalizados en formato JSON {"Authorization": "Bearer token"}';

-- =====================================================
-- TABLA: webhook_logs
-- Registro de entregas de webhooks (éxito y fallos)
-- =====================================================
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Información del evento
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  
  -- Información del request HTTP
  request_url TEXT NOT NULL,
  request_headers JSONB,
  
  -- Información de la respuesta HTTP
  status_code INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  
  -- Tracking de errores
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status_code);

COMMENT ON TABLE webhook_logs IS 'Log de entregas de webhooks con respuestas y errores';

-- =====================================================
-- TABLA: webhook_events
-- Catálogo de eventos disponibles en el sistema
-- =====================================================
CREATE TABLE webhook_events (
  id VARCHAR(100) PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  payload_example JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar eventos disponibles
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
   '{"id": "uuid", "email": "antiguo@empresa.com", "deactivated_at": "2026-01-13T20:00:00Z"}');

COMMENT ON TABLE webhook_events IS 'Catálogo de eventos disponibles para webhooks';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Seguridad a nivel de fila para multi-tenancy
-- =====================================================

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- WEBHOOKS: Solo el tenant puede gestionar sus propios webhooks
CREATE POLICY "Tenants can view own webhooks"
  ON webhooks FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Tenants can insert own webhooks"
  ON webhooks FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Tenants can update own webhooks"
  ON webhooks FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Tenants can delete own webhooks"
  ON webhooks FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- WEBHOOK LOGS: Solo lectura para el tenant
CREATE POLICY "Tenants can view own webhook logs"
  ON webhook_logs FOR SELECT
  USING (webhook_id IN (
    SELECT id FROM webhooks WHERE tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  ));

-- WEBHOOK EVENTS: Catálogo público (todos pueden leer)
CREATE POLICY "Anyone can view webhook events"
  ON webhook_events FOR SELECT
  USING (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_updated_at();

-- =====================================================
-- FUNCIÓN: trigger_webhooks
-- Función helper para disparar webhooks desde triggers
-- Esta función será llamada por los triggers de eventos
-- (se creará en Fase 4 junto con Edge Function)
-- =====================================================
-- NOTA: Por ahora solo creamos el placeholder
-- La implementación completa vendrá en Fase 4

CREATE OR REPLACE FUNCTION trigger_webhooks(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_data JSONB
) RETURNS void AS $$
BEGIN
  -- Placeholder: La implementación real vendrá en Fase 4
  -- cuando tengamos la Edge Function configurada
  RAISE NOTICE 'Webhook trigger: % for tenant % with data %', p_event_type, p_tenant_id, p_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_webhooks IS 'Dispara webhooks para un evento específico (implementación en Fase 4)';
