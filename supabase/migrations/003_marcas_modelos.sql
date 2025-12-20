-- =============================================
-- TABLAS ADICIONALES: MARCAS Y MODELOS
-- =============================================
-- Ejecutar si las tablas no existen

-- Tabla de Marcas
CREATE TABLE IF NOT EXISTS marcas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  pais TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, nombre)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_marcas_empresa ON marcas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_marcas_nombre ON marcas(nombre);

-- Tabla de Modelos
CREATE TABLE IF NOT EXISTS modelos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  marca_id UUID NOT NULL REFERENCES marcas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo_equipo TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(marca_id, nombre)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_modelos_empresa ON modelos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_modelos_marca ON modelos(marca_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_marcas_updated_at ON marcas;
CREATE TRIGGER update_marcas_updated_at
    BEFORE UPDATE ON marcas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_modelos_updated_at ON modelos;
CREATE TRIGGER update_modelos_updated_at
    BEFORE UPDATE ON modelos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS PARA MARCAS Y MODELOS
-- =============================================

ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;

-- Marcas
DROP POLICY IF EXISTS "marcas_select" ON marcas;
CREATE POLICY "marcas_select" ON marcas FOR SELECT
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

DROP POLICY IF EXISTS "marcas_insert" ON marcas;
CREATE POLICY "marcas_insert" ON marcas FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() OR is_super_admin());

DROP POLICY IF EXISTS "marcas_update" ON marcas;
CREATE POLICY "marcas_update" ON marcas FOR UPDATE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

DROP POLICY IF EXISTS "marcas_delete" ON marcas;
CREATE POLICY "marcas_delete" ON marcas FOR DELETE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

-- Modelos
DROP POLICY IF EXISTS "modelos_select" ON modelos;
CREATE POLICY "modelos_select" ON modelos FOR SELECT
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

DROP POLICY IF EXISTS "modelos_insert" ON modelos;
CREATE POLICY "modelos_insert" ON modelos FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() OR is_super_admin());

DROP POLICY IF EXISTS "modelos_update" ON modelos;
CREATE POLICY "modelos_update" ON modelos FOR UPDATE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

DROP POLICY IF EXISTS "modelos_delete" ON modelos;
CREATE POLICY "modelos_delete" ON modelos FOR DELETE
USING (empresa_id = get_user_empresa_id() OR is_super_admin());

-- =============================================
-- INSERTAR MARCAS PREDETERMINADAS
-- (Se ejecuta para cada empresa existente)
-- =============================================

-- Función para insertar marcas default a una empresa
CREATE OR REPLACE FUNCTION insert_default_marcas(p_empresa_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO marcas (empresa_id, nombre, pais) VALUES
    (p_empresa_id, 'Bosch', 'Alemania'),
    (p_empresa_id, 'Makita', 'Japón'),
    (p_empresa_id, 'DeWalt', 'Estados Unidos'),
    (p_empresa_id, 'Milwaukee', 'Estados Unidos'),
    (p_empresa_id, 'Emtop', 'China'),
    (p_empresa_id, 'Total', 'China'),
    (p_empresa_id, 'Sweiss', 'Ecuador'),
    (p_empresa_id, 'Esii', 'Ecuador'),
    (p_empresa_id, 'Growan', 'Ecuador'),
    (p_empresa_id, 'Stanley', 'Estados Unidos'),
    (p_empresa_id, 'Black+Decker', 'Estados Unidos'),
    (p_empresa_id, 'Hitachi', 'Japón'),
    (p_empresa_id, 'Metabo', 'Alemania'),
    (p_empresa_id, 'Ryobi', 'Japón')
  ON CONFLICT (empresa_id, nombre) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger para insertar marcas al crear empresa
CREATE OR REPLACE FUNCTION on_empresa_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM insert_default_marcas(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_insert_default_marcas ON empresas;
CREATE TRIGGER trigger_insert_default_marcas
  AFTER INSERT ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION on_empresa_created();
