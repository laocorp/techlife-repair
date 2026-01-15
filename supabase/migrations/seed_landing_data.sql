-- =====================================================
-- SEED DATA PARA SCREENSHOTS (Corregido V3)
-- =====================================================

-- 1. Asegurar que tenemos un Tenant de Demo
INSERT INTO tenants (id, name, slug, plan_id, subscription_status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'TechRepair Demo', 'demo-tenant', (SELECT id FROM plans WHERE price_monthly > 0 LIMIT 1), 'active')
ON CONFLICT (id) DO UPDATE SET name = 'TechRepair Demo';

-- 2. Crear Clientes Ficticios (USANDO 'company_name' que es el campo correcto)
INSERT INTO clients (tenant_id, company_name, email, phone, address)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Juan Pérez', 'juan.p@example.com', '+593 99 123 4567', 'Av. Amazonas N24'),
    ('00000000-0000-0000-0000-000000000001', 'María González', 'maria.g@example.com', '+593 98 765 4321', 'Calle Larga 123'),
    ('00000000-0000-0000-0000-000000000001', 'Carlos Ramírez', 'carlos.r@techcorp.com', '+593 99 888 7777', 'Edificio Trade Center'),
    ('00000000-0000-0000-0000-000000000001', 'Ana López', 'ana.l@design.studio', '+593 97 111 2222', 'La Mariscal'),
    ('00000000-0000-0000-0000-000000000001', 'Luisa Mendoza', 'luisa.m@example.com', '+593 96 333 4444', 'Urdesa Central');

-- 3. Crear Inventario (Productos)
INSERT INTO products (tenant_id, name, description, sku, stock_quantity, min_stock_level, unit_price, cost_price)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Pantalla iPhone 13 Pro', 'OLED Original Refurbished', 'SCR-IP13P-001', 15, 5, 180.00, 90.00),
    ('00000000-0000-0000-0000-000000000001', 'Batería MacBook Air M1', 'Original Apple A2389', 'BAT-MBA-M1', 8, 3, 120.00, 65.00),
    ('00000000-0000-0000-0000-000000000001', 'SSD NVMe 1TB Samsung', '970 EVO Plus', 'SSD-SAM-1TB', 22, 10, 110.00, 75.00),
    ('00000000-0000-0000-0000-000000000001', 'Pasta Térmica Arctic MX-4', '4g Alta conductividad', 'THR-MX4-4G', 50, 20, 12.00, 5.00),
    ('00000000-0000-0000-0000-000000000001', 'Puerto de Carga Samsung S23', 'Flex de carga original', 'CHG-S23-001', 12, 5, 35.00, 15.00);

-- 4. Crear Órdenes de Trabajo (Variados estados)
INSERT INTO work_orders (tenant_id, client_id, order_number, device_type, device_brand, device_model, device_serial, problem_description, status, priority, estimated_cost)
VALUES
    -- En Progreso
    ('00000000-0000-0000-0000-000000000001', (SELECT id FROM clients WHERE company_name = 'Juan Pérez' LIMIT 1), 'WO-001', 'Smartphone', 'Apple', 'iPhone 13 Pro', 'SN827364', 'Pantalla rota y no carga', 'in_progress', 'high', 220.00),
    
    -- Pendiente
    ('00000000-0000-0000-0000-000000000001', (SELECT id FROM clients WHERE company_name = 'María González' LIMIT 1), 'WO-002', 'Laptop', 'Lenovo', 'ThinkPad X1', 'LNV99283', 'Se calienta mucho y se apaga', 'pending', 'medium', 45.00),
    
    -- Completada
    ('00000000-0000-0000-0000-000000000001', (SELECT id FROM clients WHERE company_name = 'Carlos Ramírez' LIMIT 1), 'WO-003', 'Tablet', 'Samsung', 'Galaxy Tab S8', 'SM-X700', 'Cambio de batería', 'completed', 'low', 85.00),
    
    -- Lista para entrega
    ('00000000-0000-0000-0000-000000000001', (SELECT id FROM clients WHERE company_name = 'Ana López' LIMIT 1), 'WO-004', 'Laptop', 'Apple', 'MacBook Air M1', 'FVFDH22', 'Mantenimiento preventivo', 'delivered', 'medium', 60.00);

-- 5. Crear Facturas (Historial financiero)
INSERT INTO invoices (tenant_id, client_id, work_order_id, invoice_number, total, status, due_date)
VALUES
    ('00000000-0000-0000-0000-000000000001', (SELECT id FROM clients WHERE company_name = 'Carlos Ramírez' LIMIT 1), (SELECT id FROM work_orders WHERE device_model = 'Galaxy Tab S8' LIMIT 1), 'INV-001', 85.00, 'paid', CURRENT_DATE + 30);
