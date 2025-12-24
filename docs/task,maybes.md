## 📅 Fase 1: Core e Inventario (Prioridad Alta)
**Objetivo:** Vincular repuestos a órdenes y automatizar costos.
- [x] **Schema:** Crear tabla `OrdenDetalle` (relación Orden <-> Producto).
- [x] **Schema:** Actualizar `OrdenServicio` para cálculos automáticos (o virtual fields).
- [x] **Backend:** Actualizar API de Órdenes (`POST/PUT`) para recibir lista de repuestos.
- [x] **Backend:** Implementar lógica de descuento de stock al aprobar/usar repuesto.
- [x] **Frontend:** Componente "Buscador de Repuestos" en formulario de Orden.
- [x] **Frontend:** Visualización de desglose de costos (Mano de Obra + Repuestos).

## 💳 Fase 2: Finanzas y Cobranzas
**Objetivo:** Gestión de abonos y cuentas por cobrar.
- [x] **Schema:** Crear modelo `Abono` (imp. como `Pago`) vinculado a Órdenes/Ventas.
- [x] **Backend:** API para registrar abonos parciales.
- [x] **Frontend:** Vista "Cuenta Corriente" por Cliente (Deuda Total vs Pagado).
- [x] **Frontend:** Indicadores visuales de morosidad (>30 días).

## 🛡️ Fase 3: Seguridad y Roles (RBAC)
**Objetivo:** Control de acceso granular.
- [x] **Schema:** Implementar modelos `Role` y `Permission`.
- [x] **Backend:** Middleware de verificación de permisos por ruta.
- [x] **Frontend:** Interfaz de gestión de usuarios y asignación de roles.
- [x] **Audit:** Tabla `ActivityLog` para registrar acciones críticas.

## 🛍️ Fase 4: Tienda y POS Avanzado
**Objetivo:** Experiencia de venta moderna.
- [ ] **Schema:** Campo `imagenes` (array) y `codigo_barras` en Producto.
- [ ] **Frontend:** Galerías de imágenes en administración de productos.
- [ ] **Frontend:** Soporte para pistola de código de barras en POS.
- [ ] **Frontend:** Carrito de compras persistente.

## 📊 Fase 5: Reportes e Insights
**Objetivo:** Inteligencia de negocio.
- [ ] **Frontend:** Dashboard Financiero (Flujo de caja real).
- [ ] **Backend:** Generador de Backup (Dump de BD).
- [ ] **Frontend:** Reportes de stock valorizado.