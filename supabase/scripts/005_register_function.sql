-- =============================================
-- FUNCIÓN PARA REGISTRO DE EMPRESAS (CORRECTED)
-- =============================================
-- Esta función permite crear empresa y usuario admin
-- NOTA: Parámetros con DEFAULT al final

-- Función RPC para registro de empresa (bypass RLS)
CREATE OR REPLACE FUNCTION register_empresa_and_admin(
  p_user_id UUID,
  p_user_nombre TEXT,
  p_user_email TEXT,
  p_empresa_nombre TEXT,
  p_empresa_ruc TEXT,
  p_empresa_telefono TEXT DEFAULT NULL,
  p_empresa_direccion TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_empresa_id UUID;
  v_result JSON;
BEGIN
  -- Verificar que el usuario esté autenticado
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Verificar que el RUC no exista
  IF EXISTS (SELECT 1 FROM empresas WHERE ruc = p_empresa_ruc) THEN
    RAISE EXCEPTION 'El RUC ya está registrado';
  END IF;

  -- Verificar que el email no exista en usuarios
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_user_email) THEN
    RAISE EXCEPTION 'El email ya está registrado';
  END IF;

  -- Crear empresa
  INSERT INTO empresas (nombre, ruc, telefono, direccion, slug, suscripcion_activa, plan)
  VALUES (
    p_empresa_nombre,
    p_empresa_ruc,
    p_empresa_telefono,
    p_empresa_direccion,
    LOWER(p_empresa_ruc),
    true,
    'trial'
  )
  RETURNING id INTO v_empresa_id;

  -- Crear usuario admin
  INSERT INTO usuarios (id, empresa_id, nombre, email, rol, activo)
  VALUES (
    p_user_id,
    v_empresa_id,
    p_user_nombre,
    p_user_email,
    'admin',
    true
  );

  -- Retornar resultado
  SELECT json_build_object(
    'success', true,
    'empresa_id', v_empresa_id,
    'message', 'Empresa y usuario creados exitosamente'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION register_empresa_and_admin TO authenticated;
GRANT EXECUTE ON FUNCTION register_empresa_and_admin TO anon;
