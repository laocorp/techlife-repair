-- Portal de Clientes - Migraciones necesarias
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna user_id a clientes para vincular con auth.users
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. Agregar columna pagado a ordenes_servicio
ALTER TABLE public.ordenes_servicio
ADD COLUMN IF NOT EXISTS pagado boolean DEFAULT false;

-- 3. Crear índice para búsqueda por user_id
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);

-- 4. Política RLS para que clientes vean sus propias órdenes
CREATE POLICY "Clientes pueden ver sus propias ordenes"
ON public.ordenes_servicio
FOR SELECT
USING (
    cliente_id IN (
        SELECT id FROM public.clientes 
        WHERE user_id = auth.uid()
    )
);

-- 5. Política RLS para que clientes vean su propio perfil
CREATE POLICY "Clientes pueden ver su propio perfil"
ON public.clientes
FOR SELECT
USING (user_id = auth.uid());

-- 6. Función para crear cuenta de cliente automáticamente
CREATE OR REPLACE FUNCTION public.create_cliente_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar si el cliente tiene email y no tiene user_id
    IF NEW.email IS NOT NULL AND NEW.user_id IS NULL THEN
        -- El usuario se creará cuando el cliente use magic link
        -- Esta función solo prepara el terreno
        NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función que vincula cliente cuando hace login
CREATE OR REPLACE FUNCTION public.link_cliente_to_user()
RETURNS TRIGGER AS $$
DECLARE
    cliente_id uuid;
BEGIN
    -- Buscar cliente por email y vincularlo
    UPDATE public.clientes
    SET user_id = NEW.id
    WHERE email = NEW.email AND user_id IS NULL
    RETURNING id INTO cliente_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para vincular cliente cuando se crea usuario
DROP TRIGGER IF EXISTS on_auth_user_created_link_cliente ON auth.users;
CREATE TRIGGER on_auth_user_created_link_cliente
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.link_cliente_to_user();

COMMENT ON COLUMN public.clientes.user_id IS 'Vincula el cliente con su cuenta de usuario para el portal';
COMMENT ON COLUMN public.ordenes_servicio.pagado IS 'Indica si la orden ha sido pagada por el cliente';
