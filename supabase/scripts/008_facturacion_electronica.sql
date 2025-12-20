-- Tabla Facturación Electrónica SRI Ecuador
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tipos ENUM
CREATE TYPE public.factura_estado AS ENUM ('pendiente', 'autorizado', 'rechazado', 'anulado');
CREATE TYPE public.comprobante_tipo AS ENUM ('factura', 'nota_credito', 'nota_debito', 'comprobante_retencion', 'guia_remision');
CREATE TYPE public.sri_ambiente AS ENUM ('pruebas', 'produccion');

-- 2. Tabla principal de facturación electrónica
CREATE TABLE IF NOT EXISTS public.facturacion_electronica (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    empresa_id uuid NOT NULL,
    
    -- Tipo de comprobante
    tipo_comprobante public.comprobante_tipo NOT NULL DEFAULT 'factura',
    
    -- Numeración
    numero text NOT NULL, -- Formato: 001-001-000000001
    establecimiento text NOT NULL DEFAULT '001',
    punto_emision text NOT NULL DEFAULT '001',
    secuencial integer NOT NULL,
    
    -- Cliente/Receptor
    cliente_id uuid,
    cliente_identificacion text NOT NULL,
    cliente_tipo_identificacion text NOT NULL DEFAULT '04', -- 04=RUC, 05=Cédula, 06=Pasaporte
    cliente_nombre text NOT NULL,
    cliente_direccion text,
    cliente_telefono text,
    cliente_email text,
    
    -- Valores
    subtotal_sin_iva numeric NOT NULL DEFAULT 0,
    subtotal_con_iva numeric NOT NULL DEFAULT 0,
    subtotal numeric NOT NULL DEFAULT 0,
    descuento numeric NOT NULL DEFAULT 0,
    iva numeric NOT NULL DEFAULT 0,
    iva_porcentaje numeric NOT NULL DEFAULT 15,
    ice numeric NOT NULL DEFAULT 0,
    total numeric NOT NULL DEFAULT 0,
    
    -- SRI
    ambiente public.sri_ambiente NOT NULL DEFAULT 'pruebas',
    tipo_emision text NOT NULL DEFAULT '1', -- 1=Normal, 2=Contingencia
    clave_acceso text, -- 49 dígitos
    numero_autorizacion text,
    fecha_autorizacion timestamp with time zone,
    xml_generado text,
    xml_firmado text,
    xml_autorizado text,
    
    -- Estado
    estado public.factura_estado NOT NULL DEFAULT 'pendiente',
    mensajes_error text[],
    
    -- Fecha de emisión
    fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
    
    -- Referencia a venta (si aplica)
    venta_id uuid,
    
    -- Metadata
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT facturacion_electronica_pkey PRIMARY KEY (id),
    CONSTRAINT facturacion_electronica_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE,
    CONSTRAINT facturacion_electronica_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
    CONSTRAINT facturacion_electronica_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
    CONSTRAINT facturacion_electronica_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id),
    CONSTRAINT facturacion_electronica_numero_unique UNIQUE (empresa_id, numero)
);

-- 3. Tabla de detalles de factura
CREATE TABLE IF NOT EXISTS public.facturacion_detalle (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    factura_id uuid NOT NULL,
    
    -- Producto/Servicio
    producto_id uuid,
    codigo_principal text,
    codigo_auxiliar text,
    descripcion text NOT NULL,
    cantidad numeric NOT NULL,
    precio_unitario numeric NOT NULL,
    descuento numeric NOT NULL DEFAULT 0,
    precio_total_sin_impuesto numeric NOT NULL,
    
    -- Impuestos
    iva_codigo text NOT NULL DEFAULT '2', -- 2=IVA
    iva_porcentaje numeric NOT NULL DEFAULT 15,
    iva_valor numeric NOT NULL,
    
    CONSTRAINT facturacion_detalle_pkey PRIMARY KEY (id),
    CONSTRAINT facturacion_detalle_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturacion_electronica(id) ON DELETE CASCADE,
    CONSTRAINT facturacion_detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

-- 4. Tabla de configuración SRI por empresa
CREATE TABLE IF NOT EXISTS public.sri_configuracion (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    empresa_id uuid NOT NULL UNIQUE,
    
    -- Datos del establecimiento
    establecimiento text NOT NULL DEFAULT '001',
    punto_emision text NOT NULL DEFAULT '001',
    
    -- Secuenciales
    secuencial_factura integer NOT NULL DEFAULT 1,
    secuencial_nota_credito integer NOT NULL DEFAULT 1,
    secuencial_nota_debito integer NOT NULL DEFAULT 1,
    secuencial_retencion integer NOT NULL DEFAULT 1,
    secuencial_guia_remision integer NOT NULL DEFAULT 1,
    
    -- Ambiente
    ambiente public.sri_ambiente NOT NULL DEFAULT 'pruebas',
    tipo_emision text NOT NULL DEFAULT '1',
    
    -- Obligado a llevar contabilidad
    obligado_contabilidad boolean NOT NULL DEFAULT false,
    
    -- Contribuyente especial
    contribuyente_especial text,
    
    -- Firma electrónica (solo referencia, archivo se maneja aparte)
    firma_electronica_configurada boolean NOT NULL DEFAULT false,
    firma_electronica_vence timestamp with time zone,
    
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT sri_configuracion_pkey PRIMARY KEY (id),
    CONSTRAINT sri_configuracion_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE
);

-- 5. Índices
CREATE INDEX idx_facturacion_electronica_empresa_id ON public.facturacion_electronica(empresa_id);
CREATE INDEX idx_facturacion_electronica_cliente_id ON public.facturacion_electronica(cliente_id);
CREATE INDEX idx_facturacion_electronica_estado ON public.facturacion_electronica(estado);
CREATE INDEX idx_facturacion_electronica_fecha_emision ON public.facturacion_electronica(fecha_emision);
CREATE INDEX idx_facturacion_electronica_clave_acceso ON public.facturacion_electronica(clave_acceso);
CREATE INDEX idx_facturacion_detalle_factura_id ON public.facturacion_detalle(factura_id);

-- 6. Habilitar RLS
ALTER TABLE public.facturacion_electronica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturacion_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sri_configuracion ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS
CREATE POLICY "Usuarios pueden ver facturas de su empresa"
ON public.facturacion_electronica
FOR SELECT
USING (empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "Vendedores y admins pueden crear facturas"
ON public.facturacion_electronica
FOR INSERT
WITH CHECK (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol IN ('admin', 'vendedor')
    )
);

CREATE POLICY "Admins pueden actualizar facturas"
ON public.facturacion_electronica
FOR UPDATE
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol = 'admin'
    )
);

CREATE POLICY "Usuarios pueden ver detalles de facturas de su empresa"
ON public.facturacion_detalle
FOR SELECT
USING (
    factura_id IN (
        SELECT id FROM public.facturacion_electronica 
        WHERE empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    )
);

CREATE POLICY "Usuarios pueden gestionar detalles de sus facturas"
ON public.facturacion_detalle
FOR ALL
USING (
    factura_id IN (
        SELECT id FROM public.facturacion_electronica 
        WHERE empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    )
);

CREATE POLICY "Admins pueden ver y editar configuración SRI"
ON public.sri_configuracion
FOR ALL
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol = 'admin'
    )
);

-- 8. Función para generar secuencial
CREATE OR REPLACE FUNCTION public.get_next_secuencial(
    p_empresa_id uuid,
    p_tipo_comprobante text
)
RETURNS integer AS $$
DECLARE
    v_secuencial integer;
BEGIN
    IF p_tipo_comprobante = 'factura' THEN
        UPDATE public.sri_configuracion
        SET secuencial_factura = secuencial_factura + 1,
            updated_at = now()
        WHERE empresa_id = p_empresa_id
        RETURNING secuencial_factura - 1 INTO v_secuencial;
    ELSIF p_tipo_comprobante = 'nota_credito' THEN
        UPDATE public.sri_configuracion
        SET secuencial_nota_credito = secuencial_nota_credito + 1,
            updated_at = now()
        WHERE empresa_id = p_empresa_id
        RETURNING secuencial_nota_credito - 1 INTO v_secuencial;
    ELSIF p_tipo_comprobante = 'nota_debito' THEN
        UPDATE public.sri_configuracion
        SET secuencial_nota_debito = secuencial_nota_debito + 1,
            updated_at = now()
        WHERE empresa_id = p_empresa_id
        RETURNING secuencial_nota_debito - 1 INTO v_secuencial;
    ELSIF p_tipo_comprobante = 'retencion' THEN
        UPDATE public.sri_configuracion
        SET secuencial_retencion = secuencial_retencion + 1,
            updated_at = now()
        WHERE empresa_id = p_empresa_id
        RETURNING secuencial_retencion - 1 INTO v_secuencial;
    ELSIF p_tipo_comprobante = 'guia_remision' THEN
        UPDATE public.sri_configuracion
        SET secuencial_guia_remision = secuencial_guia_remision + 1,
            updated_at = now()
        WHERE empresa_id = p_empresa_id
        RETURNING secuencial_guia_remision - 1 INTO v_secuencial;
    END IF;
    
    RETURN COALESCE(v_secuencial, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Comentarios
COMMENT ON TABLE public.facturacion_electronica IS 'Comprobantes electrónicos para SRI Ecuador';
COMMENT ON TABLE public.facturacion_detalle IS 'Detalles de items en comprobantes electrónicos';
COMMENT ON TABLE public.sri_configuracion IS 'Configuración SRI por empresa';
COMMENT ON COLUMN public.facturacion_electronica.clave_acceso IS 'Clave de acceso de 49 dígitos según normativa SRI';
