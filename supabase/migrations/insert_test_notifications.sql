-- Insertar una notificación de prueba
-- Reemplaza 'TU_EMPRESA_ID' con el ID real de tu empresa

-- Primero, obtén tu empresa_id:
-- SELECT id FROM empresas LIMIT 1;

-- Luego inserta la notificación:
INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
SELECT id, 'sistema', '¡Notificaciones activadas!', 'El sistema de notificaciones está funcionando correctamente.', '/configuracion'
FROM empresas LIMIT 1;

-- Insertar más notificaciones de ejemplo:
INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
SELECT id, 'orden', 'Nueva orden recibida', 'Orden #1001 - Taladro Bosch GSB 13 RE', '/ordenes/1001'
FROM empresas LIMIT 1;

INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
SELECT id, 'pago', 'Pago recibido', '$125.00 - Cliente: María García', '/caja'
FROM empresas LIMIT 1;

INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
SELECT id, 'completada', 'Orden completada', 'Orden #998 lista para entrega al cliente', '/ordenes/998'
FROM empresas LIMIT 1;
