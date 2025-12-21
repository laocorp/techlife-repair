# Task List: Próxima Sesión

## ✅ Completado (21 Dic 2024)

### 🎨 Landing Page
- [x] Rediseño completo con estilo premium neutral
- [x] Fondo con mesh gradients, dots, orbs animados
- [x] Hero con estadísticas y brand carousel
- [x] Feature, Pricing, Testimonials mejorados
- [x] CTA section con patrones

### 🔐 Firma Electrónica .p12
- [x] Componente de upload .p12 en pestaña "Facturación"
- [x] Validación de certificado
- [x] `xml-signer.ts` con firmado XAdES-BES

### 🏢 Configuración de Establecimientos
- [x] Campos en pestaña "Facturación"
- [x] Ambiente SRI toggle
- [x] Validación formato códigos SRI

### 🖼️ Logo y Branding
- [x] Upload de logo en pestaña "Empresa"
- [x] Preview 96x96 con delete
- [x] Subida a Supabase Storage (bucket `logos`)

### 🔔 Sistema de Notificaciones
- [x] Tabla `notificaciones` en Supabase
- [x] Hook `useNotificaciones` con Realtime
- [x] Dropdown dinámico en header
- [x] Marcar como leída / todas
- [x] Badge contador dinámico
- [x] Iconos coloreados por tipo

### 💾 Persistencia de Preferencias
- [x] Botón "Guardar Preferencias" en Notificaciones
- [x] localStorage persistence

---

## 📋 Tareas Pendientes

### 1. � Secuenciales de Factura
**Prioridad: MEDIA**

- [ ] Crear tabla `secuenciales` en Supabase
- [ ] Función para auto-incrementar
- [ ] Integrar con generación de factura

```sql
CREATE TABLE secuenciales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id),
    tipo_documento TEXT,
    establecimiento TEXT,
    punto_emision TEXT,
    secuencial INTEGER DEFAULT 1,
    UNIQUE(empresa_id, tipo_documento, establecimiento, punto_emision)
);
```

---

### 2. � Página de Notificaciones Completa
**Prioridad: BAJA**

- [ ] Crear `/notificaciones` page
- [ ] Lista paginada de todas las notificaciones
- [ ] Filtros por tipo y fecha

---

### 3. � Triggers de Notificaciones Automáticas
**Prioridad: BAJA**

- [ ] Trigger: Nueva orden → notificación
- [ ] Trigger: Pago recibido → notificación
- [ ] Trigger: Orden completada → notificación

---

### 4. 🧪 Testing de Firma XML
**Prioridad: ALTA**

- [ ] Probar con certificado real del SRI
- [ ] Validar XML firmado en ambiente pruebas
- [ ] Verificar formato XAdES-BES

---

## 📊 Resumen de Archivos Modificados/Creados

| Archivo | Cambios |
|---------|---------|
| `landing-page.tsx` | Rediseño completo (~800 líneas) |
| `header.tsx` | Dropdown notificaciones real (~320 líneas) |
| `configuracion/page.tsx` | Logo upload, notif save |
| `use-notifications.ts` | **NUEVO** Hook Realtime (155 líneas) |
| `xml-signer.ts` | **NUEVO** Firmado XAdES-BES |
| `create_notificaciones_table.sql` | **NUEVO** Tabla + RLS |

---

## 📝 Notas

1. **Buckets creados**: `logos` (público), `certificados` (privado)
2. **Tabla creada**: `notificaciones` con Realtime habilitado
3. **Certificado**: El .p12 debe probarse con certificado real del SRI
