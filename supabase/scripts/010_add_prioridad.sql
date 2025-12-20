-- Agregar columna prioridad a ordenes_servicio
-- Ejecutar en Supabase SQL Editor

-- Agregar columna prioridad si no existe
ALTER TABLE public.ordenes_servicio
ADD COLUMN IF NOT EXISTS prioridad text DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente'));

-- Crear índice para prioridad
CREATE INDEX IF NOT EXISTS idx_ordenes_servicio_prioridad ON public.ordenes_servicio(prioridad);

COMMENT ON COLUMN public.ordenes_servicio.prioridad IS 'Nivel de prioridad de la orden: baja, normal, alta, urgente';
