-- =============================================
-- RLS POLICIES FOR SUPER ADMIN
-- =============================================
-- Run this in Supabase SQL Editor to add super admin permissions

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean,
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- EMPRESAS - Super Admin Full Access
-- =============================================
-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Super admins can do everything on empresas" ON empresas;

-- Super admin can SELECT all empresas
CREATE POLICY "Super admins can view all empresas" ON empresas
  FOR SELECT USING (is_super_admin());

-- Super admin can INSERT empresas
CREATE POLICY "Super admins can create empresas" ON empresas
  FOR INSERT WITH CHECK (is_super_admin());

-- Super admin can UPDATE all empresas
CREATE POLICY "Super admins can update all empresas" ON empresas
  FOR UPDATE USING (is_super_admin());

-- Super admin can DELETE empresas
CREATE POLICY "Super admins can delete empresas" ON empresas
  FOR DELETE USING (is_super_admin());

-- =============================================
-- USUARIOS - Super Admin Full Access
-- =============================================
CREATE POLICY "Super admins can view all usuarios" ON usuarios
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can create usuarios" ON usuarios
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update all usuarios" ON usuarios
  FOR UPDATE USING (is_super_admin());

CREATE POLICY "Super admins can delete usuarios" ON usuarios
  FOR DELETE USING (is_super_admin());

-- =============================================
-- OTHER TABLES - Super Admin Read Access
-- =============================================
CREATE POLICY "Super admins can view all clientes" ON clientes
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can view all productos" ON productos
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can view all ordenes" ON ordenes_servicio
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can view all ventas" ON ventas
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can view all pagos" ON pagos
  FOR SELECT USING (is_super_admin());

-- =============================================
-- VERIFY POLICIES
-- =============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'empresas'
ORDER BY policyname;
