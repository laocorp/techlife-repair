
# Plan de Acción: Implementación de Features Faltantes y Estándar

Este plan prioriza los requerimientos directos del cliente (Puntos 1-6) y luego incorpora las mejoras del listado "Estándar" que aportan mayor valor inmediato.

## 📅 Fase 1: Core del Negocio (Órdenes e Inventario)
**Objetivo:** Automatizar costos y descontar stock real desde reparaciones. (Req. Cliente #1 y #5)

1.  **Schema Update (Base de Datos):**
    -   Crear tabla `OrdenDetalle` (o `OrdenRepuesto`) relacionando `OrdenServicio` con `Producto`.
    -   Campos sugeridos: `producto_id`, `cantidad`, `precio_unitario`, `impuesto`.
2.  **Lógica Backend:**
    -   Actualizar `route.ts` de Órdenes para recibir items/repuestos.
    -   Implementar decremento de stock al cambiar estado a "En Reparación" o "Terminado".
3.  **Frontend (UI):**
    -   Agregar "Buscador de Repuestos" dentro del formulario de Órdenes.
    -   Visualizar desglose: $Mano de Obra + \sum Repuestos$.

## 💳 Fase 2: Finanzas y Cobranzas (Req. Cliente #2 y #4)
**Objetivo:** Control total de deudas, abonos y cuenta corriente del cliente.

1.  **Schema Update:**
    -   Crear tabla `Abono` vinculada a `OrdenServicio` (o `Venta`).
    -   Campos: `monto`, `fecha`, `metodo_pago`, `nota`.
2.  **Módulo "Cuenta Corriente":**
    -   Nueva vista `/clientes/[id]/estado-cuenta`.
    -   Cálculo en vivo: `(Total Reparaciones + Ventas) - (Total Pagos + Abonos) = Saldo`.
3.  **Alertas:**
    -   Cron job o lógica en vista para resaltar deudas > 30 días en rojo (Cliente #4).

## 🛡️ Fase 3: Seguridad y Roles (Req. Cliente #6 + Standard Features)
**Objetivo:** Matriz de accesos y seguridad granular.

1.  **Sistema RBAC:**
    -   Migrar `rol` (string) a tabla `Role` con relaciones `Permission`.
    -   Definir roles base: `Super Admin`, `Admin`, `Jefe Taller`, `Técnico`, `Vendedor`, `Contador`.
2.  **Middleware:**
    -   Actualizar validación de rutas para chequear permisos específicos (ej. `can_view_reports`, `can_edit_stock`).
3.  **Logs (Standard Feature):**
    -   Crear tabla `ActivityLog` para auditar acciones sensibles (borrar orden, ajustar stock).

## 🛍️ Fase 4: Tienda y POS Avanzado (Req. Cliente #5 + Standard Features)
**Objetivo:** Mejorar la experiencia de venta y gestión de productos.

1.  **Mejoras de Producto:**
    -   Soporte para múltiples imágenes (Galería).
    -   Soporte para Variantes (Talla/Color) y Barcodes.
2.  **POS Upgrade:**
    -   Soporte para scanner de código de barras (listener global en vista POS).
    -   Carrito persistente (LocalStorage).
3.  **Label Printing (Standard):**
    -   Generador de PDF para etiquetas de códigos de barras (ZPL/PDF 50x25mm).

## 📊 Fase 5: Reportes e "Insights" (Standard Features)
**Objetivo:** Inteligencia de negocio.

1.  **Dashboard Financiero:**
    -   Gráficos reales de flujo de caja diario.
    -   Reporte de "Stock Valorizado" y "Baja Rotación".
2.  **Backup Manual:**
    -   Botón en Admin para generar dump JSON/SQL de la data crítica.

---

## 🚀 Resumen de Prioridades

| Semana | Foco | Entregables Clave |
| :--- | :--- | :--- |
| **1** | Órdenes + Inventario | Repuestos en órdenes, Descuento stock. |
| **2** | Cobranzas | Abonos parciales, Estado de Cuenta Cliente. |
| **3** | Roles + Seguridad | Nuevo esquema de permisos, Roles personalizados. |
| **4** | Tienda/POS | Galería de fotos, Códigos de barra. |
