-- Tabla de Notificaciones para RepairApp
-- Ejecutar en Supabase SQL Editor

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('orden', 'pago', 'sistema', 'completada')),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notificaciones_empresa ON notificaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(empresa_id, leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created ON notificaciones(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios solo ven notificaciones de su empresa
CREATE POLICY "Users can view own company notifications" ON notificaciones
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

-- Política: Usuarios pueden marcar como leída
CREATE POLICY "Users can update own company notifications" ON notificaciones
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

-- Política: Sistema puede insertar (para triggers/functions)
CREATE POLICY "System can insert notifications" ON notificaciones
    FOR INSERT WITH CHECK (true);

-- Habilitar Realtime para la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;

-- Insertar notificaciones de ejemplo (opcional)
-- INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
-- SELECT id, 'sistema', 'Bienvenido a RepairApp', 'Tu cuenta ha sido configurada correctamente.', '/configuracion'
-- FROM empresas LIMIT 1;
