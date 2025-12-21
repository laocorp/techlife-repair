-- ============================================================
-- RepairApp - PostgreSQL Database Schema
-- Ejecutar en Dokploy PostgreSQL Console
-- ============================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: empresas
-- ============================================================
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    ruc VARCHAR(13),
    razon_social VARCHAR(255),
    nombre_comercial VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    
    -- Facturación SRI
    establecimiento VARCHAR(3) DEFAULT '001',
    punto_emision VARCHAR(3) DEFAULT '001',
    ambiente_sri VARCHAR(20) DEFAULT 'pruebas',
    obligado_contabilidad BOOLEAN DEFAULT false,
    
    -- Certificado
    certificado_p12_url TEXT,
    certificado_password TEXT,
    certificado_vence TIMESTAMPTZ,
    
    -- Suscripción
    plan VARCHAR(50) DEFAULT 'trial',
    suscripcion_activa BOOLEAN DEFAULT true,
    fecha_vencimiento TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'tecnico',
    activo BOOLEAN DEFAULT true,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ============================================================
-- TABLA: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    identificacion VARCHAR(20),
    tipo_id VARCHAR(20) DEFAULT 'cedula',
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    password VARCHAR(255),
    
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, identificacion)
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);

-- ============================================================
-- TABLA: ordenes_servicio
-- ============================================================
CREATE TABLE IF NOT EXISTS ordenes_servicio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) NOT NULL,
    
    -- Cliente
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    
    -- Equipo
    equipo_tipo VARCHAR(50) NOT NULL,
    equipo_marca VARCHAR(100) NOT NULL,
    equipo_modelo VARCHAR(100),
    equipo_serie VARCHAR(100),
    equipo_accesorios TEXT,
    
    -- Problema
    problema_reportado TEXT NOT NULL,
    diagnostico TEXT,
    solucion TEXT,
    
    -- Estado
    estado VARCHAR(50) DEFAULT 'recibido',
    prioridad VARCHAR(20) DEFAULT 'normal',
    
    -- Costos
    costo_estimado DECIMAL(10,2),
    costo_final DECIMAL(10,2),
    anticipo DECIMAL(10,2),
    
    -- Fechas
    fecha_recepcion TIMESTAMPTZ DEFAULT NOW(),
    fecha_promesa TIMESTAMPTZ,
    fecha_entrega TIMESTAMPTZ,
    
    -- Técnico
    tecnico_id UUID REFERENCES usuarios(id),
    creado_por_id UUID REFERENCES usuarios(id),
    
    -- Empresa
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- QR
    qr_code TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_ordenes_empresa ON ordenes_servicio(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_servicio(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON ordenes_servicio(cliente_id);

-- ============================================================
-- TABLA: productos
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    marca VARCHAR(100),
    
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    
    activo BOOLEAN DEFAULT true,
    
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);

-- ============================================================
-- TABLA: ventas
-- ============================================================
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) NOT NULL,
    
    cliente_id UUID REFERENCES clientes(id),
    
    subtotal DECIMAL(10,2) NOT NULL,
    iva DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    
    metodo_pago VARCHAR(50) DEFAULT 'efectivo',
    estado VARCHAR(50) DEFAULT 'completada',
    
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_ventas_empresa ON ventas(empresa_id);

-- ============================================================
-- TABLA: ventas_detalle
-- ============================================================
CREATE TABLE IF NOT EXISTS ventas_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ventas_detalle_venta ON ventas_detalle(venta_id);

-- ============================================================
-- TABLA: notificaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    link TEXT,
    
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_empresa ON notificaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(empresa_id, leida);

-- ============================================================
-- TABLA: secuenciales
-- ============================================================
CREATE TABLE IF NOT EXISTS secuenciales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento VARCHAR(50) NOT NULL,
    establecimiento VARCHAR(3) NOT NULL,
    punto_emision VARCHAR(3) NOT NULL,
    secuencial INTEGER DEFAULT 1,
    
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    UNIQUE(empresa_id, tipo_documento, establecimiento, punto_emision)
);

-- ============================================================
-- TABLA: sri_configuracion
-- ============================================================
CREATE TABLE IF NOT EXISTS sri_configuracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID UNIQUE NOT NULL,
    
    razon_social VARCHAR(255),
    nombre_comercial VARCHAR(255),
    direccion_matriz TEXT,
    establecimiento VARCHAR(3) DEFAULT '001',
    punto_emision VARCHAR(3) DEFAULT '001',
    direccion_establecimiento TEXT,
    ambiente VARCHAR(20) DEFAULT 'pruebas',
    obligado_contabilidad BOOLEAN DEFAULT false,
    contribuyente_especial VARCHAR(20),
    tipo_emision VARCHAR(5) DEFAULT '1',
    
    firma_electronica_configurada BOOLEAN DEFAULT false,
    firma_electronica_vence TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCIÓN: Obtener siguiente secuencial
-- ============================================================
CREATE OR REPLACE FUNCTION obtener_siguiente_secuencial(
    p_empresa_id UUID,
    p_tipo_documento VARCHAR,
    p_establecimiento VARCHAR,
    p_punto_emision VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_secuencial INTEGER;
BEGIN
    -- Insertar si no existe, o incrementar si existe
    INSERT INTO secuenciales (empresa_id, tipo_documento, establecimiento, punto_emision, secuencial)
    VALUES (p_empresa_id, p_tipo_documento, p_establecimiento, p_punto_emision, 1)
    ON CONFLICT (empresa_id, tipo_documento, establecimiento, punto_emision)
    DO UPDATE SET secuencial = secuenciales.secuencial + 1
    RETURNING secuencial INTO v_secuencial;
    
    RETURN v_secuencial;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DATOS INICIALES: Empresa de prueba
-- ============================================================
INSERT INTO empresas (nombre, ruc, plan) 
VALUES ('Mi Empresa', '0000000000001', 'trial')
ON CONFLICT DO NOTHING;

-- Usuario admin inicial (password: admin123)
-- bcrypt hash of 'admin123'
INSERT INTO usuarios (email, password, nombre, rol, empresa_id)
SELECT 
    'admin@repairapp.com',
    '$2a$10$rQnM1v5F5p5F5p5F5p5F5uwXwXwXwXwXwXwXwXwXwXwXwXwXwXwXwX',
    'Administrador',
    'admin',
    (SELECT id FROM empresas LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@repairapp.com');

-- ============================================================
-- LISTO! Base de datos configurada
-- ============================================================
