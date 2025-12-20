-- Sistema de Suscripciones - Planes y pagos
-- Ejecutar en Supabase SQL Editor

-- 1. Tipos ENUM
CREATE TYPE public.plan_tipo AS ENUM ('basico', 'profesional', 'enterprise');
CREATE TYPE public.suscripcion_estado AS ENUM ('activa', 'cancelada', 'vencida', 'trial');
CREATE TYPE public.pago_estado AS ENUM ('pendiente', 'completado', 'fallido', 'reembolsado');

-- 2. Tabla de planes
CREATE TABLE IF NOT EXISTS public.planes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    nombre text NOT NULL,
    tipo public.plan_tipo NOT NULL,
    descripcion text,
    precio_mensual numeric NOT NULL,
    precio_anual numeric, -- Con descuento
    
    -- Límites
    max_usuarios integer NOT NULL DEFAULT 2,
    max_ordenes_mes integer, -- NULL = ilimitado
    max_productos integer, -- NULL = ilimitado
    max_facturas_mes integer, -- NULL = ilimitado
    
    -- Features
    portal_clientes boolean NOT NULL DEFAULT false,
    reportes_avanzados boolean NOT NULL DEFAULT false,
    api_acceso boolean NOT NULL DEFAULT false,
    multi_sucursal boolean NOT NULL DEFAULT false,
    soporte_prioritario boolean NOT NULL DEFAULT false,
    
    activo boolean NOT NULL DEFAULT true,
    orden integer NOT NULL DEFAULT 0,
    
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT planes_pkey PRIMARY KEY (id)
);

-- 3. Tabla de suscripciones
CREATE TABLE IF NOT EXISTS public.suscripciones (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    empresa_id uuid NOT NULL UNIQUE,
    plan_id uuid NOT NULL,
    
    estado public.suscripcion_estado NOT NULL DEFAULT 'trial',
    
    -- Fechas
    fecha_inicio timestamp with time zone NOT NULL DEFAULT now(),
    fecha_fin timestamp with time zone,
    trial_hasta timestamp with time zone,
    
    -- Facturación
    periodo text NOT NULL DEFAULT 'mensual', -- mensual, anual
    proximo_pago timestamp with time zone,
    
    -- Descuentos
    descuento_porcentaje numeric DEFAULT 0,
    codigo_promocional text,
    
    -- Metadata
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT suscripciones_pkey PRIMARY KEY (id),
    CONSTRAINT suscripciones_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE,
    CONSTRAINT suscripciones_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planes(id)
);

-- 4. Tabla de pagos
CREATE TABLE IF NOT EXISTS public.pagos (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    empresa_id uuid NOT NULL,
    suscripcion_id uuid NOT NULL,
    
    monto numeric NOT NULL,
    moneda text NOT NULL DEFAULT 'USD',
    estado public.pago_estado NOT NULL DEFAULT 'pendiente',
    
    -- Proveedor de pago
    proveedor text, -- payphone, kushki, stripe, etc.
    transaccion_id text,
    referencia_externa text,
    
    -- Detalles
    descripcion text,
    factura_id uuid, -- Referencia a factura generada
    
    -- Fechas
    fecha_pago timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT pagos_pkey PRIMARY KEY (id),
    CONSTRAINT pagos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE,
    CONSTRAINT pagos_suscripcion_id_fkey FOREIGN KEY (suscripcion_id) REFERENCES public.suscripciones(id)
);

-- 5. Índices
CREATE INDEX idx_suscripciones_empresa_id ON public.suscripciones(empresa_id);
CREATE INDEX idx_suscripciones_estado ON public.suscripciones(estado);
CREATE INDEX idx_pagos_empresa_id ON public.pagos(empresa_id);
CREATE INDEX idx_pagos_estado ON public.pagos(estado);

-- 6. Habilitar RLS
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS
-- Planes son públicos (lectura)
CREATE POLICY "Cualquiera puede ver planes activos"
ON public.planes
FOR SELECT
USING (activo = true);

-- Suscripciones
CREATE POLICY "Usuarios pueden ver suscripcion de su empresa"
ON public.suscripciones
FOR SELECT
USING (empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "Admins pueden gestionar suscripcion"
ON public.suscripciones
FOR ALL
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
);

-- Pagos
CREATE POLICY "Admins pueden ver pagos de su empresa"
ON public.pagos
FOR SELECT
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
);

-- 8. Insertar planes por defecto
INSERT INTO public.planes (tipo, nombre, descripcion, precio_mensual, precio_anual, max_usuarios, max_ordenes_mes, max_productos, max_facturas_mes, portal_clientes, reportes_avanzados, api_acceso, multi_sucursal, soporte_prioritario, orden)
VALUES 
('basico', 'Básico', 'Perfecto para talleres pequeños', 29, 290, 2, 100, 500, 100, false, false, false, false, false, 1),
('profesional', 'Profesional', 'Para talleres en crecimiento', 59, 590, 10, 9999, 9999, 9999, true, true, false, false, true, 2),
('enterprise', 'Enterprise', 'Para grandes operaciones', 149, 1490, 9999, 9999, 9999, 9999, true, true, true, true, true, 3);

-- 9. Función para verificar límites del plan
CREATE OR REPLACE FUNCTION public.check_plan_limit(
    p_empresa_id uuid,
    p_tipo_limite text -- 'usuarios', 'ordenes', 'productos', 'facturas'
)
RETURNS boolean AS $$
DECLARE
    v_plan record;
    v_count integer;
BEGIN
    -- Obtener plan de la empresa
    SELECT p.* INTO v_plan
    FROM public.suscripciones s
    JOIN public.planes p ON p.id = s.plan_id
    WHERE s.empresa_id = p_empresa_id AND s.estado IN ('activa', 'trial');
    
    IF NOT FOUND THEN
        RETURN false; -- No tiene suscripción activa
    END IF;
    
    -- Verificar según tipo de límite
    IF p_tipo_limite = 'usuarios' THEN
        SELECT COUNT(*) INTO v_count FROM public.usuarios WHERE empresa_id = p_empresa_id AND activo = true;
        RETURN v_count < COALESCE(v_plan.max_usuarios, 999999);
    ELSIF p_tipo_limite = 'ordenes' THEN
        SELECT COUNT(*) INTO v_count FROM public.ordenes_servicio 
        WHERE empresa_id = p_empresa_id 
        AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE);
        RETURN v_count < COALESCE(v_plan.max_ordenes_mes, 999999);
    ELSIF p_tipo_limite = 'productos' THEN
        SELECT COUNT(*) INTO v_count FROM public.productos WHERE empresa_id = p_empresa_id AND activo = true;
        RETURN v_count < COALESCE(v_plan.max_productos, 999999);
    ELSIF p_tipo_limite = 'facturas' THEN
        SELECT COUNT(*) INTO v_count FROM public.facturacion_electronica 
        WHERE empresa_id = p_empresa_id 
        AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE);
        RETURN v_count < COALESCE(v_plan.max_facturas_mes, 999999);
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Comentarios
COMMENT ON TABLE public.planes IS 'Planes de suscripción disponibles';
COMMENT ON TABLE public.suscripciones IS 'Suscripciones activas por empresa';
COMMENT ON TABLE public.pagos IS 'Historial de pagos';
