-- =============================================
-- RLS POLICIES FIX - COMPLETE SETUP (CORRECTED)
-- =============================================
-- Este script soluciona todos los problemas de RLS
-- NOTA: Basado en el esquema real de 001_initial_schema.sql
-- =============================================

-- =============================================
-- 1. FUNCIÓN AUXILIAR: is_super_admin
-- =============================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean,
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================
-- 2. ELIMINAR POLÍTICAS ANTERIORES (empresas)
-- =============================================
DROP POLICY IF EXISTS "Empresas: usuarios ven su empresa" ON empresas;
DROP POLICY IF EXISTS "Empresas: super admin ve todas" ON empresas;
DROP POLICY IF EXISTS "Empresas: registro público" ON empresas;
DROP POLICY IF EXISTS "Empresas: super admin crea" ON empresas;
DROP POLICY IF EXISTS "Empresas: super admin actualiza" ON empresas;
DROP POLICY IF EXISTS "Empresas: super admin elimina" ON empresas;
DROP POLICY IF EXISTS "Super admins can view all empresas" ON empresas;
DROP POLICY IF EXISTS "Super admins can create empresas" ON empresas;
DROP POLICY IF EXISTS "Super admins can update all empresas" ON empresas;
DROP POLICY IF EXISTS "Super admins can delete empresas" ON empresas;
DROP POLICY IF EXISTS "Users can view their empresa" ON empresas;
DROP POLICY IF EXISTS "Allow public registration" ON empresas;
DROP POLICY IF EXISTS "empresas_select_own" ON empresas;
DROP POLICY IF EXISTS "empresas_insert_authenticated" ON empresas;
DROP POLICY IF EXISTS "empresas_update" ON empresas;
DROP POLICY IF EXISTS "empresas_delete" ON empresas;

-- =============================================
-- 3. EMPRESAS - POLÍTICAS NUEVAS
-- =============================================
-- SELECT: Usuarios ven su propia empresa o super admin
CREATE POLICY "empresas_select_own"
ON empresas FOR SELECT
USING (
  id = get_user_empresa_id() 
  OR is_super_admin()
);

-- INSERT: Usuarios autenticados pueden crear empresas (registro)
CREATE POLICY "empresas_insert_authenticated"
ON empresas FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  OR is_super_admin()
);

-- UPDATE: Solo admin de la empresa o super admin
CREATE POLICY "empresas_update"
ON empresas FOR UPDATE
USING (
  id = get_user_empresa_id() 
  OR is_super_admin()
);

-- DELETE: Solo super admin
CREATE POLICY "empresas_delete"
ON empresas FOR DELETE
USING (is_super_admin());

-- =============================================
-- 4. USUARIOS - ELIMINAR POLÍTICAS ANTERIORES
-- =============================================
DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
DROP POLICY IF EXISTS "Super admins can view all usuarios" ON usuarios;
DROP POLICY IF EXISTS "Super admins can create usuarios" ON usuarios;
DROP POLICY IF EXISTS "Super admins can update all usuarios" ON usuarios;
DROP POLICY IF EXISTS "Super admins can delete usuarios" ON usuarios;
DROP POLICY IF EXISTS "Users can view company users" ON usuarios;
DROP POLICY IF EXISTS "Users can insert themselves" ON usuarios;
DROP POLICY IF EXISTS "Admins can manage users" ON usuarios;
DROP POLICY IF EXISTS "Users can view users from their company" ON usuarios;
DROP POLICY IF EXISTS "Admins can insert users" ON usuarios;
DROP POLICY IF EXISTS "Admins can update users" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete" ON usuarios;

-- =============================================
-- 5. USUARIOS - POLÍTICAS NUEVAS
-- =============================================
-- SELECT: Usuarios ven usuarios de su empresa o su propio perfil
CREATE POLICY "usuarios_select"
ON usuarios FOR SELECT
USING (
  empresa_id = get_user_empresa_id()
  OR id = auth.uid()
  OR is_super_admin()
);

-- INSERT: Usuario puede crear su propio registro (para registro)
CREATE POLICY "usuarios_insert"
ON usuarios FOR INSERT
WITH CHECK (
  id = auth.uid()
  OR is_super_admin()
);

-- UPDATE: Usuario puede actualizar su perfil o admin
CREATE POLICY "usuarios_update"
ON usuarios FOR UPDATE
USING (
  id = auth.uid()
  OR (empresa_id = get_user_empresa_id() AND EXISTS (
    SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'
  ))
  OR is_super_admin()
);

-- DELETE: Solo admin de empresa o super admin
CREATE POLICY "usuarios_delete"
ON usuarios FOR DELETE
USING (
  (empresa_id = get_user_empresa_id() AND EXISTS (
    SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'
  ))
  OR is_super_admin()
);

-- =============================================
-- 6. CLIENTES - CORREGIR POLÍTICAS
-- =============================================
DROP POLICY IF EXISTS "Users can view clients from their company" ON clientes;
DROP POLICY IF EXISTS "Users can insert clients" ON clientes;
DROP POLICY IF EXISTS "Users can update clients" ON clientes;
DROP POLICY IF EXISTS "clientes_select" ON clientes;
DROP POLICY IF EXISTS "clientes_insert" ON clientes;
DROP POLICY IF EXISTS "clientes_update" ON clientes;
DROP POLICY IF EXISTS "clientes_delete" ON clientes;

CREATE POLICY "clientes_select"
ON clientes FOR SELECT
USING (
  empresa_id = get_user_empresa_id() 
  OR user_id = auth.uid() 
  OR is_super_admin()
);

CREATE POLICY "clientes_insert"
ON clientes FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "clientes_update"
ON clientes FOR UPDATE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "clientes_delete"
ON clientes FOR DELETE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

-- =============================================
-- 7. PRODUCTOS - CORREGIR POLÍTICAS
-- =============================================
DROP POLICY IF EXISTS "Users can view products from their company" ON productos;
DROP POLICY IF EXISTS "Admins can manage products" ON productos;
DROP POLICY IF EXISTS "productos_select" ON productos;
DROP POLICY IF EXISTS "productos_insert" ON productos;
DROP POLICY IF EXISTS "productos_update" ON productos;
DROP POLICY IF EXISTS "productos_delete" ON productos;

CREATE POLICY "productos_select"
ON productos FOR SELECT
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "productos_insert"
ON productos FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "productos_update"
ON productos FOR UPDATE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "productos_delete"
ON productos FOR DELETE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

-- =============================================
-- 8. ORDENES_SERVICIO - CORREGIR POLÍTICAS
-- =============================================
DROP POLICY IF EXISTS "Users can view orders from their company" ON ordenes_servicio;
DROP POLICY IF EXISTS "Users can insert orders" ON ordenes_servicio;
DROP POLICY IF EXISTS "Users can update orders" ON ordenes_servicio;
DROP POLICY IF EXISTS "ordenes_select" ON ordenes_servicio;
DROP POLICY IF EXISTS "ordenes_insert" ON ordenes_servicio;
DROP POLICY IF EXISTS "ordenes_update" ON ordenes_servicio;
DROP POLICY IF EXISTS "ordenes_delete" ON ordenes_servicio;

CREATE POLICY "ordenes_select"
ON ordenes_servicio FOR SELECT
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "ordenes_insert"
ON ordenes_servicio FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "ordenes_update"
ON ordenes_servicio FOR UPDATE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "ordenes_delete"
ON ordenes_servicio FOR DELETE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

-- =============================================
-- 9. VENTAS - CORREGIR POLÍTICAS
-- =============================================
DROP POLICY IF EXISTS "Users can view sales from their company" ON ventas;
DROP POLICY IF EXISTS "Users can insert sales" ON ventas;
DROP POLICY IF EXISTS "ventas_select" ON ventas;
DROP POLICY IF EXISTS "ventas_insert" ON ventas;
DROP POLICY IF EXISTS "ventas_update" ON ventas;

CREATE POLICY "ventas_select"
ON ventas FOR SELECT
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "ventas_insert"
ON ventas FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "ventas_update"
ON ventas FOR UPDATE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

-- =============================================
-- 10. VENTAS_DETALLE - CORREGIR POLÍTICAS
-- =============================================
DROP POLICY IF EXISTS "Users can view sales details" ON ventas_detalle;
DROP POLICY IF EXISTS "Users can insert sales details" ON ventas_detalle;
DROP POLICY IF EXISTS "ventas_detalle_select" ON ventas_detalle;
DROP POLICY IF EXISTS "ventas_detalle_insert" ON ventas_detalle;

CREATE POLICY "ventas_detalle_select"
ON ventas_detalle FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ventas v
    WHERE v.id = ventas_detalle.venta_id
    AND (v.empresa_id = get_user_empresa_id() OR is_super_admin())
  )
);

CREATE POLICY "ventas_detalle_insert"
ON ventas_detalle FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ventas v
    WHERE v.id = ventas_detalle.venta_id
    AND (v.empresa_id = get_user_empresa_id() OR is_super_admin())
  )
);

-- =============================================
-- 11. CAJA - CORREGIR POLÍTICAS
-- =============================================
DROP POLICY IF EXISTS "Users can view their company's cash registers" ON caja;
DROP POLICY IF EXISTS "Users can manage cash registers" ON caja;
DROP POLICY IF EXISTS "caja_select" ON caja;
DROP POLICY IF EXISTS "caja_insert" ON caja;
DROP POLICY IF EXISTS "caja_update" ON caja;

CREATE POLICY "caja_select"
ON caja FOR SELECT
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "caja_insert"
ON caja FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "caja_update"
ON caja FOR UPDATE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

-- =============================================
-- 12. CAJA_MOVIMIENTOS - CORREGIR POLÍTICAS
-- =============================================
DROP POLICY IF EXISTS "Users can view cash movements" ON caja_movimientos;
DROP POLICY IF EXISTS "Users can insert cash movements" ON caja_movimientos;
DROP POLICY IF EXISTS "caja_movimientos_select" ON caja_movimientos;
DROP POLICY IF EXISTS "caja_movimientos_insert" ON caja_movimientos;

CREATE POLICY "caja_movimientos_select"
ON caja_movimientos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM caja c
    WHERE c.id = caja_movimientos.caja_id
    AND (c.empresa_id = get_user_empresa_id() OR is_super_admin())
  )
);

CREATE POLICY "caja_movimientos_insert"
ON caja_movimientos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM caja c
    WHERE c.id = caja_movimientos.caja_id
    AND (c.empresa_id = get_user_empresa_id() OR is_super_admin())
  )
);

-- =============================================
-- 13. PAGOS - CORREGIR POLÍTICAS
-- =============================================
DROP POLICY IF EXISTS "Users can view payments" ON pagos;
DROP POLICY IF EXISTS "Users can manage payments" ON pagos;
DROP POLICY IF EXISTS "pagos_select" ON pagos;
DROP POLICY IF EXISTS "pagos_insert" ON pagos;
DROP POLICY IF EXISTS "pagos_update" ON pagos;

CREATE POLICY "pagos_select"
ON pagos FOR SELECT
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "pagos_insert"
ON pagos FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() OR is_super_admin());

CREATE POLICY "pagos_update"
ON pagos FOR UPDATE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

-- =============================================
-- 14. MARCAS - La tabla es GLOBAL (sin empresa_id)
-- Por lo tanto, solo lectura para todos, escritura para super_admin
-- =============================================
DROP POLICY IF EXISTS "marcas_select" ON marcas;
DROP POLICY IF EXISTS "marcas_insert" ON marcas;
DROP POLICY IF EXISTS "marcas_update" ON marcas;

-- Habilitar RLS si no está habilitado
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer marcas (es global)
CREATE POLICY "marcas_select"
ON marcas FOR SELECT
USING (true);

-- Solo super admin puede insertar/actualizar
CREATE POLICY "marcas_insert"
ON marcas FOR INSERT
WITH CHECK (is_super_admin());

CREATE POLICY "marcas_update"
ON marcas FOR UPDATE
USING (is_super_admin());

-- =============================================
-- 15. MODELOS - La tabla es GLOBAL (sin empresa_id)
-- =============================================
DROP POLICY IF EXISTS "modelos_select" ON modelos;
DROP POLICY IF EXISTS "modelos_insert" ON modelos;
DROP POLICY IF EXISTS "modelos_update" ON modelos;

ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer modelos
CREATE POLICY "modelos_select"
ON modelos FOR SELECT
USING (true);

-- Solo super admin puede insertar/actualizar
CREATE POLICY "modelos_insert"
ON modelos FOR INSERT
WITH CHECK (is_super_admin());

CREATE POLICY "modelos_update"
ON modelos FOR UPDATE
USING (is_super_admin());

-- =============================================
-- 16. TRACKING PÚBLICO - Función para ver orden sin auth
-- =============================================
CREATE OR REPLACE FUNCTION public_order_tracking(order_id UUID)
RETURNS TABLE (
  id UUID,
  numero_orden VARCHAR,
  equipo TEXT,
  marca TEXT,
  modelo TEXT,
  estado VARCHAR,
  problema_reportado TEXT,
  diagnostico TEXT,
  costo_servicio DECIMAL,
  costo_repuestos DECIMAL,
  fecha_recepcion TIMESTAMPTZ,
  fecha_estimada TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.numero_orden,
    o.equipo,
    o.marca,
    o.modelo,
    o.estado,
    o.problema_reportado,
    o.diagnostico,
    o.costo_servicio,
    o.costo_repuestos,
    o.fecha_recepcion,
    o.fecha_estimada
  FROM ordenes_servicio o
  WHERE o.id = order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 17. VERIFICACIÓN
-- =============================================
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
