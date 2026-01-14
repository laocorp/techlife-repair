# Guía de Implementación - Fase 4: Edge Function + Triggers

## 📦 Archivos Creados

1. **Edge Function**: `supabase/functions/send-webhook/index.ts`
2. **Database Triggers**: `supabase/migrations/20260114_webhook_triggers.sql`

---

## 🚀 Pasos para Deployment

### 1. Configurar Variables de Entorno en Supabase

Antes de deployar, necesitas configurar estas variables:

**En Supabase Dashboard:**
1. Ve a `Settings` → `API`
2. Copia `Project URL` y `service_role key`
3. Ve a `Database` → `Extensions` → Habilita `pg_net` (para hacer HTTP requests)

**Configurar en PostgreSQL (SQL Editor):**
```sql
-- Configurar URL de Edge Functions
ALTER DATABASE postgres SET app.supabase_functions_url = 'https://TU-PROJECT-REF.supabase.co/functions/v1';

-- Configurar service_role key (para autenticación interna)
ALTER DATABASE postgres SET app.supabase_service_key = 'TU-SERVICE-ROLE-KEY-AQUI';
```

### 2. Deploy Edge Function

```bash
# Asegúrate de tener Supabase CLI instalado
npm install -g supabase

# Login
supabase login

# Link a tu proyecto
supabase link --project-ref TU-PROJECT-REF

# Deploy la función
supabase functions deploy send-webhook

# Verificar que se deployó
supabase functions list
```

### 3. Ejecutar Migración de Triggers

**Opción A: Desde Dashboard**
1. Ve a `SQL Editor` en Supabase Dashboard
2. Copia todo el contenido de `20260114_webhook_triggers.sql`
3. Ejecuta

**Opción B: Desde CLI**
```bash
supabase db push
```

### 4. Verificar Triggers Creados

```sql
-- Ver todos los triggers de webhooks
SELECT 
  event_object_table as tabla,
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'webhook_%'
ORDER BY event_object_table, trigger_name;
```

Deberías ver triggers en:
- ✅ `work_orders` (4 triggers)
- ✅ `clients` (2 triggers)
- ✅ `users` (2 triggers)
- ✅ `invoices` (2 triggers, si existe la tabla)
- ✅ `products` (3 triggers, si existe la tabla)

---

## 🧪 Testing End-to-End

### Paso 1: Crear Webhook Test en n8n

1. Abre n8n
2. Crea nuevo workflow
3. Agrega nodo "Webhook"
4. Configura:
   - Method: `POST`
   - Path: Cualquiera (ej: `/techrepair-test`)
5. Copia la URL del webhook
6. Agrega nodo "Code" para inspeccionar payload
7. **Activa el workflow**

### Paso 2: Crear Webhook en TechRepair

1. Ve a `/dashboard/settings/webhooks`
2. Click "Nuevo Webhook"
3. Configura:
   - Nombre: "Test n8n - Órdenes"
   - URL: `URL-DE-N8N-COPIADA`
   - Eventos: Selecciona "Orden Creada"
   - Webhook Activo: ✅
4. Guarda

### Paso 3: Disparar Evento

**Crear una orden de trabajo nueva:**
1. Ve a work orders en tu app
2. Crea una nueva orden
3. Completa el formulario
4. Guarda

### Paso 4: Verificar en n8n

1. Ve a n8n → Executions
2. Deberías ver una ejecución nueva
3. Inspecciona el payload recibido:

```json
{
  "event": "work_order.created",
  "tenant_id": "uuid-tenant",
  "data": {
    "id": "uuid-wo",
    "client_name": "Juan Pérez",
    "device": "iPhone 13",
    "issue": "Pantalla rota",
    "status": "pending",
    "created_at": "2026-01-13T..."
  },
  "timestamp": "2026-01-13T..."
}
```

### Paso 5: Verificar Logs en TechRepair

1. Ve a `/dashboard/settings/webhooks`
2. Click en "Ver Logs" del webhook
3. Deberías ver:
   - ✅ Status: 200 (exitoso)
   - ✅ Event Type: work_order.created
   - ✅ Response time en ms

---

## 🔒 Validar Firma HMAC en n8n (Opcional)

Para máxima seguridad, valida que el webhook viene de tu sistema:

**En n8n, nodo "Code":**
```javascript
const crypto = require('crypto');

// Headers del webhook
const receivedSignature = $node["Webhook"].json["headers"]["x-webhook-signature"];
const secret = 'TU-SECRET-DESDE-TECHREPAIR'; // Del campo Secret en el webhook

// Payload recibido
const payload = JSON.stringify($node["Webhook"].json["body"]);

// Calcular firma esperada
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

// Validar
if (receivedSignature !== expectedSignature) {
  throw new Error('❌ Firma inválida - Webhook no autenticado');
}

// Si llegamos aquí, el webhook es auténtico
return $node["Webhook"].json["body"];
```

---

## 🎯 Casos de Uso Comunes

### 1. Notificar Técnico por WhatsApp

**Workflow n8n:**
1. Webhook recibe `work_order.created`
2. Nodo HTTP: GET técnico asignado
3. Nodo WhatsApp (Evolution API): Envía mensaje
   ```
   🔧 Nueva orden asignada
   Cliente: {{data.client_name}}
   Dispositivo: {{data.device}}
   Problema: {{data.issue}}
   ```

### 2. Email al Cliente

**Trigger:** `work_order.completed`
**Workflow:**
1. Webhook recibe evento
2. Nodo Email: Enviar a `{{data.client_email}}`
   ```
   Hola {{data.client_name}},
   
   Tu reparación de {{data.device}} ha sido completada.
   Puedes pasar a recoger tu equipo.
   ```

### 3. Sincronizar con Google Sheets

**Trigger:** `invoice.created`
**Workflow:**
1. Webhook recibe factura
2. Nodo Google Sheets: Agregar fila
   - Fecha, Cliente, Monto, Estado

### 4. Alerta de Inventario

**Trigger:** `inventory.low_stock`
**Workflow:**
1. Webhook recibe alerta
2. Nodo Telegram/Slack: Notificar
   ```
   ⚠️ Stock bajo
   Producto: {{data.name}}
   Stock actual: {{data.current_stock}}
   Mínimo: {{data.min_stock}}
   ```

---

## 🐛 Troubleshooting

### Webhook no se dispara

1. **Verificar triggers:**
   ```sql
   SELECT * FROM webhooks WHERE is_active = true;
   ```

2. **Verificar configuración:**
   ```sql
   SHOW app.supabase_functions_url;
   SHOW app.supabase_service_key;
   ```

3. **Ver logs de Edge Function:**
   ```bash
   supabase functions logs send-webhook
   ```

### Error en logs

**Ver detalles:**
```sql
SELECT * FROM webhook_logs 
WHERE error IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

**Errores comunes:**
- `Connection refused`: URL incorrecta en n8n
- `Timeout`: n8n workflow no activo
- `401 Unauthorized`: Edge Function con permisos incorrectos

---

## ✅ Checklist Final

- [ ] Edge Function deployada y activa
- [ ] Variables de entorno configuradas en DB
- [ ] Migración de triggers ejecutada
- [ ] Webhook creado en TechRepair
- [ ] Workflow n8n configurado y activo
- [ ] Test exitoso con orden de trabajo
- [ ] Logs muestran entregas exitosas (status 200)
- [ ] Validación HMAC implementada (opcional)

---

## 🎉 ¡Sistema Completo!

Ahora tienes un sistema de webhooks totalmente funcional que:
- ✅ Dispara eventos automáticamente en 15+ escenarios
- ✅ Envía con retry logic y exponential backoff
- ✅ Registra todos los intentos y errores
- ✅ Soporta validación HMAC
- ✅ UI completa para gestión visual
- ✅ Integración seamless con n8n

**Siguiente nivel:** Crear templates de n8n predefinidos para casos comunes y compartirlos con usuarios.
