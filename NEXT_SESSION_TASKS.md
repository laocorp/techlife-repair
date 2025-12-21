# Task List: Próxima Sesión (21 Dic 2024)

## 🎯 Objetivo Principal
Completar la configuración de empresa con firma electrónica .p12, establecimientos, y funcionalidad de notificaciones.

---

## 📋 Tareas Pendientes

### 1. 🔐 Firma Electrónica .p12
**Prioridad: ALTA** | **Ubicación**: `src/app/(dashboard)/configuracion/page.tsx`

- [ ] Añadir sección de carga de certificado .p12 en la pestaña "Facturación"
- [ ] Crear componente de upload para archivo .p12
- [ ] Almacenar certificado en Supabase Storage (bucket privado)
- [ ] Guardar referencia y contraseña encriptada en tabla `empresas`
- [ ] Crear función de firmado XML en `src/lib/sri/xml-signer.ts`
- [ ] Integrar firmado con el generador XML existente (`src/lib/sri/xml-generator.ts`)

**Campos a añadir en BD `empresas`:**
```sql
certificado_p12_url TEXT,
certificado_password TEXT (encriptado),
certificado_valido_hasta TIMESTAMP
```

---

### 2. 🏢 Configuración de Establecimientos
**Prioridad: ALTA** | **Ubicación**: `src/app/(dashboard)/configuracion/page.tsx`

- [ ] Añadir campos de establecimiento y punto de emisión en pestaña "Facturación"
- [ ] Campos requeridos:
  - Código de establecimiento (3 dígitos, ej: "001")
  - Punto de emisión (3 dígitos, ej: "001")
  - Dirección del establecimiento
  - Ambiente SRI (Pruebas / Producción)
- [ ] Validar formato correcto de códigos SRI
- [ ] Guardar en tabla `empresas` existente

---

### 3. 🖼️ Logo y Branding
**Prioridad: MEDIA** | **Ubicación**: `src/app/(dashboard)/configuracion/page.tsx`

- [ ] Añadir upload de logo en pestaña "Empresa"
- [ ] Almacenar en Supabase Storage (bucket público)
- [ ] Mostrar preview del logo
- [ ] Usar logo en facturas PDF y órdenes de servicio

---

### 4. 🔔 Botón de Notificaciones (Header)
**Prioridad: ALTA** | **Ubicación**: `src/components/layout/header.tsx`

- [ ] Implementar dropdown de notificaciones en el botón existente
- [ ] Crear tabla `notificaciones` en Supabase:
  ```sql
  CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id),
    usuario_id UUID REFERENCES usuarios(id),
    tipo TEXT, -- 'orden', 'pago', 'sistema'
    titulo TEXT,
    mensaje TEXT,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
  );
  ```
- [ ] Crear hook `useNotificaciones` para suscripción realtime
- [ ] Mostrar badge con contador de no leídas
- [ ] Listar últimas 10 notificaciones en dropdown
- [ ] Marcar como leída al hacer click

---

### 5. 📄 Pestaña Facturación Completa
**Prioridad: ALTA** | **Ubicación**: `src/app/(dashboard)/configuracion/page.tsx`

Actualmente la pestaña "Facturación" está vacía. Añadir:

- [ ] Sección: **Datos del Emisor**
  - Razón Social (obligatorio para SRI)
  - Nombre Comercial
  - Dirección Matriz
  - Obligado a llevar contabilidad (Sí/No)
  
- [ ] Sección: **Establecimiento**
  - Código establecimiento
  - Punto de emisión
  - Dirección establecimiento

- [ ] Sección: **Certificado Digital**
  - Upload .p12
  - Contraseña
  - Estado de validez
  - Fecha de vencimiento

- [ ] Sección: **Ambiente SRI**
  - Toggle Pruebas / Producción
  - Tipo de emisión (Normal / Contingencia)

---

### 6. 💾 Persistencia de Notificaciones (Configuración)
**Prioridad: MEDIA** | **Ubicación**: `src/app/(dashboard)/configuracion/page.tsx`

Actualmente los switches de notificaciones no se guardan. Añadir:

- [ ] Crear tabla `configuracion_notificaciones` o añadir columnas a `empresas`
- [ ] Implementar `handleSaveNotificaciones()`
- [ ] Cargar preferencias al iniciar

---

### 7. 📱 Secuencial de Factura
**Prioridad: MEDIA** | **Ubicación**: Base de datos

- [ ] Crear tabla `secuenciales` para manejar numeración:
  ```sql
  CREATE TABLE secuenciales (
    id UUID PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id),
    tipo_documento TEXT, -- 'factura', 'nota_credito', 'guia_remision'
    establecimiento TEXT,
    punto_emision TEXT,
    secuencial INTEGER DEFAULT 1,
    UNIQUE(empresa_id, tipo_documento, establecimiento, punto_emision)
  );
  ```
- [ ] Función para obtener y autoincrementa secuencial

---

## 🔧 Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `src/app/(dashboard)/configuracion/page.tsx` | Expandir con nuevas secciones |
| `src/components/layout/header.tsx` | Implementar dropdown notificaciones |
| `src/lib/sri/xml-signer.ts` | **NUEVO** - Firmado de XML con .p12 |
| `src/hooks/use-notifications.ts` | **NUEVO** - Hook de notificaciones |
| `src/types/database.ts` | Actualizar interface `Empresa` |

---

## 📊 Estructura Final de `empresas`

```typescript
interface Empresa {
  id: string
  nombre: string
  ruc: string
  razon_social: string           // NUEVO
  nombre_comercial: string       // NUEVO
  direccion: string
  telefono: string
  email: string
  logo_url: string
  
  // Facturación SRI
  establecimiento: string        // Ya existe
  punto_emision: string          // Ya existe
  ambiente_sri: 'pruebas' | 'produccion'
  obligado_contabilidad: boolean // NUEVO
  
  // Certificado
  certificado_p12_url: string    // NUEVO
  certificado_password: string   // NUEVO (encriptado)
  certificado_valido_hasta: Date // NUEVO
  
  // Suscripción
  plan: string
  suscripcion_activa: boolean
  fecha_vencimiento: Date
}
```

---

## ⏱️ Estimación de Tiempo

| Tarea | Tiempo Estimado |
|-------|-----------------|
| Firma .p12 | 2-3 horas |
| Establecimientos | 1 hora |
| Logo upload | 30 min |
| Notificaciones | 2 horas |
| Pestaña Facturación | 1.5 horas |
| Persistencia config | 30 min |
| Secuenciales | 1 hora |

**Total estimado: ~8-9 horas**

---

## 📝 Notas Importantes

1. **Seguridad .p12**: El certificado debe almacenarse de forma segura. Considerar:
   - Bucket privado en Supabase Storage
   - Contraseña encriptada con clave de servidor
   - Nunca exponer el .p12 al frontend

2. **Validación SRI**: Antes de pasar a producción, validar XMLs en ambiente de pruebas del SRI.

3. **Realtime Notificaciones**: Usar Supabase Realtime para updates en vivo.
