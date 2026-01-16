-- =====================================================
-- TEST RÁPIDO: Verificar si puedes leer eventos
-- Ejecuta esto en Supabase SQL Editor
-- =====================================================

-- Como usuario autenticado, intenta leer eventos
SELECT * FROM webhook_events WHERE is_active = true;

-- Si esto funciona, el problema es en el frontend
-- Si da error, es un problema de RLS

-- ALTERNATIVA: Desactivar RLS temporalmente para testing
ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;

-- Después de que funcione, vuelve a habilitar RLS
-- ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
