-- Fix autorización clientes para admin
-- Ejecutar en Supabase SQL Editor

-- Eliminar políticas existentes que podrían estar causando problemas
DROP POLICY IF EXISTS "Usuarios pueden ver clientes de su empresa" ON public.clientes;
DROP POLICY IF EXISTS "Clientes creadospermiten insert" ON public.clientes;
DROP POLICY IF EXISTS "Clientes update por empresa" ON public.clientes;

-- Crear nuevas políticas para clientes
-- SELECT: Usuarios pueden ver clientes de su empresa
CREATE POLICY "Usuarios ven clientes de su empresa"
ON public.clientes
FOR SELECT
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    OR user_id = auth.uid()
);

-- INSERT: Usuarios pueden crear clientes para su empresa
CREATE POLICY "Usuarios crean clientes"
ON public.clientes
FOR INSERT
WITH CHECK (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);

-- UPDATE: Usuarios pueden actualizar clientes de su empresa
CREATE POLICY "Usuarios actualizan clientes"
ON public.clientes
FOR UPDATE
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);

-- DELETE: Solo admin puede eliminar clientes
CREATE POLICY "Admin elimina clientes"
ON public.clientes
FOR DELETE
USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol = 'admin'
    )
);

-- Verificar que RLS está habilitado
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clientes IS 'Clientes vinculados a cada empresa con políticas RLS corregidas';
