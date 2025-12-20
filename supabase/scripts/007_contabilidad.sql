-- Tabla de Contabilidad - Módulo básico de ingresos y egresos
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tipo ENUM para tipo de movimiento
CREATE TYPE public.movimiento_tipo AS ENUM ('ingreso', 'egreso');

-- 2. Crear tabla de contabilidad
CREATE TABLE IF NOT EXISTS public.contabilidad (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    empresa_id uuid NOT NULL,
    tipo public.movimiento_tipo NOT NULL,
    categoria text NOT NULL,
    monto numeric NOT NULL CHECK (monto > 0),
    descripcion text,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    CONSTRAINT contabilidad_pkey PRIMARY KEY (id),
    CONSTRAINT contabilidad_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE,
    CONSTRAINT contabilidad_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id)
);

-- 3. Índices para consultas frecuentes
CREATE INDEX idx_contabilidad_empresa_id ON public.contabilidad(empresa_id);
CREATE INDEX idx_contabilidad_fecha ON public.contabilidad(fecha);
CREATE INDEX idx_contabilidad_tipo ON public.contabilidad(tipo);

-- 4. Habilitar RLS
ALTER TABLE public.contabilidad ENABLE ROW LEVEL SECURITY;

-- 5. Política RLS - Solo usuarios de la empresa pueden ver/modificar
CREATE POLICY "Usuarios pueden ver contabilidad de su empresa"
ON public.contabilidad
FOR SELECT
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);

CREATE POLICY "Admins pueden insertar contabilidad"
ON public.contabilidad
FOR INSERT
WITH CHECK (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol = 'admin'
    )
);

CREATE POLICY "Admins pueden actualizar contabilidad"
ON public.contabilidad
FOR UPDATE
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol = 'admin'
    )
);

CREATE POLICY "Admins pueden eliminar contabilidad"
ON public.contabilidad
FOR DELETE
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol = 'admin'
    )
);

-- 6. Comentarios
COMMENT ON TABLE public.contabilidad IS 'Registro de ingresos y egresos de la empresa';
COMMENT ON COLUMN public.contabilidad.tipo IS 'Tipo de movimiento: ingreso o egreso';
COMMENT ON COLUMN public.contabilidad.categoria IS 'Categoría del movimiento (ej: Ventas, Sueldos, etc)';
COMMENT ON COLUMN public.contabilidad.monto IS 'Monto del movimiento (siempre positivo)';
