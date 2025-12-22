-- ============================================================
-- Triggers para Notificaciones Automáticas
-- Ejecutar en PostgreSQL después del schema principal
-- ============================================================

-- ============================================================
-- TRIGGER 1: Nueva Orden de Servicio
-- Crea notificación cuando se recibe un nuevo equipo
-- ============================================================
CREATE OR REPLACE FUNCTION fn_notificar_nueva_orden()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
    VALUES (
        NEW.empresa_id,
        'orden',
        'Nueva orden recibida',
        'Orden #' || NEW.numero || ' - ' || NEW.equipo_tipo || ' ' || NEW.equipo_marca,
        '/ordenes/' || NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nueva_orden ON ordenes_servicio;
CREATE TRIGGER trigger_nueva_orden
    AFTER INSERT ON ordenes_servicio
    FOR EACH ROW
    EXECUTE FUNCTION fn_notificar_nueva_orden();

-- ============================================================
-- TRIGGER 2: Orden Completada (cambio de estado)
-- Notifica cuando una orden cambia a estado 'entregado'
-- ============================================================
CREATE OR REPLACE FUNCTION fn_notificar_orden_completada()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si el estado cambió a 'entregado'
    IF NEW.estado = 'entregado' AND OLD.estado != 'entregado' THEN
        INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
        VALUES (
            NEW.empresa_id,
            'completada',
            'Orden completada',
            'Orden #' || NEW.numero || ' ha sido entregada al cliente',
            '/ordenes/' || NEW.id
        );
    END IF;
    
    -- Notificar si cambió a 'en_reparacion'
    IF NEW.estado = 'en_reparacion' AND OLD.estado != 'en_reparacion' THEN
        INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
        VALUES (
            NEW.empresa_id,
            'orden',
            'Orden en reparación',
            'Orden #' || NEW.numero || ' está siendo trabajada',
            '/ordenes/' || NEW.id
        );
    END IF;
    
    -- Notificar si cambió a 'listo'
    IF NEW.estado = 'listo' AND OLD.estado != 'listo' THEN
        INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
        VALUES (
            NEW.empresa_id,
            'completada',
            'Orden lista para entrega',
            'Orden #' || NEW.numero || ' está lista para entregar al cliente',
            '/ordenes/' || NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_orden_estado ON ordenes_servicio;
CREATE TRIGGER trigger_orden_estado
    AFTER UPDATE ON ordenes_servicio
    FOR EACH ROW
    WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
    EXECUTE FUNCTION fn_notificar_orden_completada();

-- ============================================================
-- TRIGGER 3: Nueva Venta / Pago
-- Notifica cuando se registra una nueva venta
-- ============================================================
CREATE OR REPLACE FUNCTION fn_notificar_nueva_venta()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
    VALUES (
        NEW.empresa_id,
        'pago',
        'Nueva venta registrada',
        'Venta #' || NEW.numero || ' por $' || NEW.total || ' - ' || UPPER(NEW.metodo_pago),
        '/pos'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nueva_venta ON ventas;
CREATE TRIGGER trigger_nueva_venta
    AFTER INSERT ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION fn_notificar_nueva_venta();

-- ============================================================
-- TRIGGER 4: Stock Bajo
-- Notifica cuando un producto baja del stock mínimo
-- ============================================================
CREATE OR REPLACE FUNCTION fn_notificar_stock_bajo()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si el stock bajó del mínimo
    IF NEW.stock < NEW.stock_minimo AND 
       (OLD.stock >= OLD.stock_minimo OR OLD.stock IS NULL) THEN
        INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
        VALUES (
            NEW.empresa_id,
            'sistema',
            '⚠️ Stock bajo',
            'Producto "' || NEW.nombre || '" tiene solo ' || NEW.stock || ' unidades (mínimo: ' || NEW.stock_minimo || ')',
            '/inventario'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stock_bajo ON productos;
CREATE TRIGGER trigger_stock_bajo
    AFTER UPDATE ON productos
    FOR EACH ROW
    WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
    EXECUTE FUNCTION fn_notificar_stock_bajo();

-- ============================================================
-- TRIGGER 5: Bienvenida a nueva empresa
-- Notifica cuando se crea una nueva empresa
-- ============================================================
CREATE OR REPLACE FUNCTION fn_notificar_bienvenida()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, link)
    VALUES (
        NEW.id,
        'sistema',
        '🎉 ¡Bienvenido a RepairApp!',
        'Tu cuenta ha sido creada. Configura tu empresa para comenzar.',
        '/configuracion'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bienvenida ON empresas;
CREATE TRIGGER trigger_bienvenida
    AFTER INSERT ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION fn_notificar_bienvenida();

-- ============================================================
-- Listo! Triggers configurados
-- ============================================================
