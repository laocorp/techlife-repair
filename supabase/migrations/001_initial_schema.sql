-- RepairApp v2 - Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- EMPRESAS (Tenants)
-- =============================================
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  ruc VARCHAR(13) UNIQUE NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  email TEXT,
  logo_url TEXT,
  slug VARCHAR(50) UNIQUE,
  -- Config SRI
  ambiente_sri VARCHAR(10) DEFAULT 'pruebas' CHECK (ambiente_sri IN ('pruebas', 'produccion')),
  certificado_p12 BYTEA,
  certificado_password TEXT,
  punto_emision VARCHAR(3) DEFAULT '001',
  establecimiento VARCHAR(3) DEFAULT '001',
  -- Suscripción
  plan VARCHAR(20) DEFAULT 'trial',
  suscripcion_activa BOOLEAN DEFAULT true,
  fecha_vencimiento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- USUARIOS
-- =============================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'tecnico', 'vendedor', 'cliente')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- CLIENTES
-- =============================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  tipo_identificacion VARCHAR(10) CHECK (tipo_identificacion IN ('cedula', 'ruc', 'pasaporte')),
  identificacion VARCHAR(20) NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono VARCHAR(20),
  direccion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, identificacion)
);

-- =============================================
-- MARCAS Y MODELOS
-- =============================================
CREATE TABLE marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  es_autorizado BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id UUID REFERENCES marcas(id) ON DELETE CASCADE,
  codigo TEXT,
  nombre TEXT NOT NULL,
  categoria TEXT,
  especificaciones JSONB,
  imagen_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default brands
INSERT INTO marcas (nombre) VALUES 
  ('Bosch'), ('Emtop'), ('Total'), ('Sweiss'), ('Esii'), ('Growan'), ('Dewalt'), ('Makita'), ('Stanley');

-- =============================================
-- PRODUCTOS
-- =============================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  codigo VARCHAR(50),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  costo DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 5,
  tipo VARCHAR(20) CHECK (tipo IN ('producto', 'servicio')),
  iva DECIMAL(4,2) DEFAULT 15.00,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÓRDENES DE SERVICIO
-- =============================================
CREATE TABLE ordenes_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  tecnico_id UUID REFERENCES usuarios(id),
  cliente_id UUID REFERENCES clientes(id),
  numero_orden VARCHAR(20) NOT NULL,
  equipo TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  serie VARCHAR(100),
  problema_reportado TEXT,
  diagnostico TEXT,
  solucion TEXT,
  estado VARCHAR(20) DEFAULT 'recibido' CHECK (estado IN ('recibido', 'en_diagnostico', 'cotizado', 'aprobado', 'rechazado', 'en_reparacion', 'terminado', 'entregado')),
  fecha_recepcion TIMESTAMPTZ DEFAULT now(),
  fecha_entrega TIMESTAMPTZ,
  fecha_estimada TIMESTAMPTZ,
  costo_servicio DECIMAL(10,2),
  costo_repuestos DECIMAL(10,2),
  informe_tecnico JSONB,
  fotos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, numero_orden)
);

-- =============================================
-- VENTAS
-- =============================================
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  cliente_id UUID REFERENCES clientes(id),
  numero_factura VARCHAR(20),
  clave_acceso VARCHAR(49),
  subtotal DECIMAL(10,2) NOT NULL,
  iva DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado_sri VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_sri IN ('pendiente', 'enviado', 'autorizado', 'rechazado')),
  xml_autorizado TEXT,
  fecha TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ventas_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  descripcion TEXT,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  iva DECIMAL(10,2) NOT NULL
);

-- =============================================
-- CAJA
-- =============================================
CREATE TABLE caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  monto_apertura DECIMAL(10,2) NOT NULL,
  monto_cierre DECIMAL(10,2),
  fecha_apertura TIMESTAMPTZ DEFAULT now(),
  fecha_cierre TIMESTAMPTZ,
  estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada'))
);

CREATE TABLE caja_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID REFERENCES caja(id) ON DELETE CASCADE,
  tipo VARCHAR(20) CHECK (tipo IN ('ingreso', 'egreso')),
  concepto TEXT,
  monto DECIMAL(10,2) NOT NULL,
  venta_id UUID REFERENCES ventas(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- PAGOS
-- =============================================
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  venta_id UUID REFERENCES ventas(id),
  orden_id UUID REFERENCES ordenes_servicio(id),
  cliente_id UUID REFERENCES clientes(id) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'credito')),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'vencido', 'parcial')),
  fecha_vencimiento DATE,
  fecha_pago TIMESTAMPTZ,
  comprobante_url TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's empresa_id
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT empresa_id FROM usuarios WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for usuarios
CREATE POLICY "Users can view users from their company" ON usuarios
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Admins can insert users" ON usuarios
  FOR INSERT WITH CHECK (
    empresa_id = get_user_empresa_id() AND
    (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update users" ON usuarios
  FOR UPDATE USING (
    empresa_id = get_user_empresa_id() AND
    (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for clientes
CREATE POLICY "Users can view clients from their company" ON clientes
  FOR SELECT USING (empresa_id = get_user_empresa_id() OR user_id = auth.uid());

CREATE POLICY "Users can insert clients" ON clientes
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update clients" ON clientes
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

-- RLS Policies for productos
CREATE POLICY "Users can view products from their company" ON productos
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Admins can manage products" ON productos
  FOR ALL USING (
    empresa_id = get_user_empresa_id() AND
    (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for ordenes_servicio
CREATE POLICY "Users can view orders from their company" ON ordenes_servicio
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert orders" ON ordenes_servicio
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update orders" ON ordenes_servicio
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

-- RLS Policies for ventas
CREATE POLICY "Users can view sales from their company" ON ventas
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert sales" ON ventas
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

-- RLS Policies for ventas_detalle
CREATE POLICY "Users can view sales details" ON ventas_detalle
  FOR SELECT USING (
    venta_id IN (SELECT id FROM ventas WHERE empresa_id = get_user_empresa_id())
  );

CREATE POLICY "Users can insert sales details" ON ventas_detalle
  FOR INSERT WITH CHECK (
    venta_id IN (SELECT id FROM ventas WHERE empresa_id = get_user_empresa_id())
  );

-- RLS Policies for caja
CREATE POLICY "Users can view their company's cash registers" ON caja
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can manage cash registers" ON caja
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- RLS Policies for caja_movimientos
CREATE POLICY "Users can view cash movements" ON caja_movimientos
  FOR SELECT USING (
    caja_id IN (SELECT id FROM caja WHERE empresa_id = get_user_empresa_id())
  );

CREATE POLICY "Users can insert cash movements" ON caja_movimientos
  FOR INSERT WITH CHECK (
    caja_id IN (SELECT id FROM caja WHERE empresa_id = get_user_empresa_id())
  );

-- RLS Policies for pagos
CREATE POLICY "Users can view payments" ON pagos
  FOR SELECT USING (empresa_id = get_user_empresa_id() OR cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage payments" ON pagos
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orden FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM ordenes_servicio
  WHERE empresa_id = NEW.empresa_id;
  
  NEW.numero_orden := 'OS-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON ordenes_servicio
  FOR EACH ROW
  WHEN (NEW.numero_orden IS NULL OR NEW.numero_orden = '')
  EXECUTE FUNCTION generate_order_number();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ordenes_updated_at
  BEFORE UPDATE ON ordenes_servicio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- VIEWS
-- =============================================

-- Dashboard stats view
CREATE OR REPLACE VIEW vista_dashboard AS
SELECT 
  e.id as empresa_id,
  (SELECT COUNT(*) FROM ordenes_servicio os WHERE os.empresa_id = e.id AND estado NOT IN ('entregado')) as ordenes_activas,
  (SELECT COUNT(*) FROM clientes c WHERE c.empresa_id = e.id) as total_clientes,
  (SELECT COALESCE(SUM(total), 0) FROM ventas v WHERE v.empresa_id = e.id AND DATE(v.fecha) = CURRENT_DATE) as ventas_hoy,
  (SELECT COUNT(*) FROM productos p WHERE p.empresa_id = e.id AND p.stock <= p.stock_minimo) as productos_stock_bajo
FROM empresas e;

-- Client portal view
CREATE OR REPLACE VIEW vista_cliente_ordenes AS
SELECT 
  os.id,
  os.numero_orden,
  os.equipo,
  os.marca,
  os.modelo,
  os.estado,
  os.fecha_recepcion,
  os.fecha_estimada,
  os.costo_servicio,
  os.costo_repuestos,
  c.id as cliente_id,
  c.user_id,
  e.nombre as empresa_nombre,
  e.slug as empresa_slug
FROM ordenes_servicio os
JOIN clientes c ON os.cliente_id = c.id
JOIN empresas e ON os.empresa_id = e.id;

COMMENT ON TABLE empresas IS 'Empresas registradas en el sistema (tenants)';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles';
COMMENT ON TABLE clientes IS 'Clientes de cada empresa';
COMMENT ON TABLE ordenes_servicio IS 'Órdenes de servicio/reparación';
COMMENT ON TABLE ventas IS 'Ventas realizadas';
COMMENT ON TABLE pagos IS 'Control de pagos de clientes';
