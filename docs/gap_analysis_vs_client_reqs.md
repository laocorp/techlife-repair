
# Análisis de Brecha: Sistema Actual vs Requerimientos del Cliente

Este documento compara las funcionalidades actuales de **RepairApp v2** con los nuevos requerimientos solicitados por el cliente.

## Resumen Ejecutivo
El sistema actual cubre satisfactoriamente el **Tracking**, **Portal de Cliente** y **Gestión Básica de Órdenes**. Sin embargo, existen brechas significativas en la **integración de inventario con órdenes de servicio**, **múltiples roles de usuario**, y **lógica avanzada de cobranzas/créditos**.

---

## 1. Gestión de Órdenes y Costos

| Requerimiento Cliente | Estado Actual | Análisis / Brecha |
| :--- | :---: | :--- |
| **Desglose Automático:** Repuestos (vinculado a Inventario) + Mano de Obra. | ⚠️ Parcial | Actualmente la `OrdenServicio` maneja `costo_estimado` y `costo_final` como valores totales. **Falta:** No existe una relación directa en la base de datos entre `OrdenServicio` y `Producto` (Inventario). Los repuestos no se descuentan automáticamente al usarse en una reparación, solo al hacerse una `Venta`. |
| **Cálculo Automático:** $Total = \sum Repuestos + MO$. | ❌ Faltante | El sistema permite ingresar el costo manual, pero no lo calcula sumando items individuales dentro de la orden. Es necesario crear una tabla `OrdenDetalle` o similar. |
| **Mano de Obra Editable** | ✅ Implementado | Se puede agregar como part del diagnóstico/solución, aunque no como un ítem facturable separado explícitamente. |

## 2. Estados de Pago y Flujo de Caja

| Requerimiento Cliente | Estado Actual | Análisis / Brecha |
| :--- | :---: | :--- |
| **Estados:** Pendiente, Pagado, **Abonado**. | ⚠️ Parcial | Existe `anticipo` en la orden y estados en las ventas. Sin embargo, no hay un flujo de "Abonos múltiples" (pagos parciales sucesivos) vinculado a una misma orden/venta de forma nativa. |
| **Reportes de Ingreso:** Solo "Pagado/Abonado" suma. | ⚠️ Parcial | El sistema de caja (`CajaMovimiento`) registra ingresos, pero la lógica para excluir "Pendientes" de los reportes financieros debe validarse. |

## 3. El Portal del Cliente

| Requerimiento Cliente | Estado Actual | Análisis / Brecha |
| :--- | :---: | :--- |
| **Mis Equipos ("Garaje Virtual")** | ✅ Implementado | El cliente puede ver sus equipos actuales y pasados en `/equipos`. |
| **Historial Clínico** | ✅ Implementado | Existe la página `/historial` donde se ven órdenes pasadas. |
| **Tracking en Tiempo Real** | ✅ Implementado | La funcionalidad de tracking (`/tracking/[id]`) muestra estados como "Recibido", "Diagnóstico", "Terminado", etc. |

## 4. Módulo de Cobranzas y Créditos

| Requerimiento Cliente | Estado Actual | Análisis / Brecha |
| :--- | :---: | :--- |
| **Cuenta Corriente:** "Total Reparado - Pagado = Saldo". | ❌ Faltante | No existe una vista consolidada de "Deuda del Cliente". Se manejan órdenes individuales. Se requiere una nueva entidad o vista que agrupe todas las deudas de un `cliente_id`. |
| **Alertas de Morosidad:** Resaltar facturas vencidas (>15/30 días). | ❌ Faltante | No hay lógica de "vencimiento" de facturas ni alertas visuales automáticas para morosos en la lista de clientes. |

## 5. Tienda e Inventario Visual

| Requerimiento Cliente | Estado Actual | Análisis / Brecha |
| :--- | :---: | :--- |
| **Galería:** Soporte para al menos 3 fotos. | ❌ Faltante | La tabla `Producto` no tiene campos para múltiples imágenes (ni siquiera una URL de imagen actualmente en el esquema básico). |
| **Carrito de Compras:** Retiro vs Envío. | ❌ Faltante | No existe un e-commerce o carrito público. El sistema es puramente de gestión interna (POS) y portal de consulta de reparaciones. |
| **Sincronización Taller-Tienda** | ⚠️ Parcial | El inventario es único, pero como se mencionó en el punto 1, el uso de repuestos en reparaciones no descuenta stock automáticamente hoy en día. |

## 6. Roles y Permisos (Matriz de Acceso)

| Requerimiento Cliente | Estado Actual | Análisis / Brecha |
| :--- | :---: | :--- |
| **Roles Granulares:** Admin, Contador, Jefe Técnicos, Técnico, Recepcionista. | ⚠️ Parcial | El sistema actual soporta roles (`admin`, `tecnico`, `vendedor`), pero son limitados. |
| **Contador (Solo Lectura/Reportes)** | ❌ Faltante | No existe el rol de "Contador" ni la lógica de permisos para restringir vistas solo a finanzas sin editar. |
| **Recepcionista vs Técnico** | ⚠️ Parcial | Se usan roles genéricos. Falta mayor granularidad en los permisos (ej. que un Técnico no pueda ver precios de compra o reportes globales). |

## 7. Sugerencia Delivery (Zonas)

| Requerimiento Cliente | Estado Actual | Análisis / Brecha |
| :--- | :---: | :--- |
| **Zonas de Entrega y Costos Auto.** | ❌ Faltante | No hay módulo de logística o configuración de zonas geográficas con costos asociados. |

---

## Recomendaciones Técnicas Inmediatas

1.  **Base de Datos (Schema):**
    *   Agregar modelo `OrdenRepuesto` o `OrdenDetalle` (relación Orden <-> Producto).
    *   Agregar campo `fotos` (array) al modelo `Producto`.
    *   Ampliar el Enum de roles o crear una tabla `Permisos`.
    *   Crear modelo `Abono` vinculado a Ventas/Órdenes para trazabilidad de pagos parciales.
2.  **Lógica de Negocio:**
    *   Implementar "hook" que descuente inventario al aprobar una orden que usa repuestos.
    *   Crear Dashboard de "Cuentas por Cobrar" para el módulo de cobranzas.
