-- Agregar columnas faltantes a ordenes_servicio
-- Ejecutar en Supabase SQL Editor

-- Agregar columna accesorios
ALTER TABLE public.ordenes_servicio
ADD COLUMN IF NOT EXISTS accesorios text;

-- Agregar columna observaciones si no existe
ALTER TABLE public.ordenes_servicio
ADD COLUMN IF NOT EXISTS observaciones text;

-- Agregar columna costo_estimado
ALTER TABLE public.ordenes_servicio
ADD COLUMN IF NOT EXISTS costo_estimado numeric DEFAULT 0;

-- Agregar columna costo_final
ALTER TABLE public.ordenes_servicio
ADD COLUMN IF NOT EXISTS costo_final numeric DEFAULT 0;

COMMENT ON COLUMN public.ordenes_servicio.accesorios IS 'Accesorios entregados con el equipo';
COMMENT ON COLUMN public.ordenes_servicio.observaciones IS 'Observaciones adicionales de la orden';
