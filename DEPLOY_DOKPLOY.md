# Guía de Despliegue en Dokploy

## Paso 1: Preparar el Repositorio

### 1.1 Subir código a GitHub
```bash
# Inicializar git (si no está hecho)
git init

# Añadir archivos
git add .

# Commit inicial
git commit -m "Initial commit: RepairApp v2"

# Crear repositorio en GitHub y añadir remote
git remote add origin https://github.com/tu-usuario/techlife-repair.git

# Subir código
git push -u origin main
```

---

## Paso 2: Configurar Dokploy

### 2.1 Crear nuevo proyecto
1. Ingresar a tu panel de Dokploy
2. Click en **"Create Project"**
3. Nombrar el proyecto: `techlife-repair`

### 2.2 Crear nuevo servicio
1. Dentro del proyecto, click en **"Add Service"** → **"Application"**
2. Seleccionar **"GitHub"** como fuente
3. Conectar tu repositorio `techlife-repair`
4. Seleccionar rama: `main`

---

## Paso 3: Configurar Variables de Entorno

En la sección **"Environment Variables"** del servicio, añadir:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lztnncxlomdhjelqziuh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

> **Importante**: En Dokploy, las variables con `NEXT_PUBLIC_` deben configurarse también como **Build Arguments** para que estén disponibles durante el build de Docker.

### 3.1 Configurar Build Arguments
En la sección **"Advanced"** → **"Build Arguments"**:
```
NEXT_PUBLIC_SUPABASE_URL=https://lztnncxlomdhjelqziuh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Paso 4: Configurar Dominio

### 4.1 Añadir dominio
1. En **"Domains"**, click en **"Add Domain"**
2. Opciones:
   - **Subdominio de Dokploy**: `techlife-repair.tu-dokploy.com`
   - **Dominio propio**: `app.techlife-repair.com`

### 4.2 Configurar SSL
1. Habilitar **"HTTPS"**
2. Dokploy generará automáticamente el certificado Let's Encrypt

---

## Paso 5: Configurar Health Checks

En **"Advanced"** → **"Health Check"**:
- **Path**: `/`
- **Interval**: `30s`
- **Timeout**: `10s`
- **Retries**: `3`

> El Dockerfile ya tiene un `HEALTHCHECK` configurado, pero Dokploy puede usar su propio sistema de health checks HTTP.

---

## Paso 6: Deploy

### 6.1 Deploy manual
1. Click en **"Deploy"**
2. Esperar a que el build termine (2-5 minutos)
3. Verificar logs en **"Deployments"** → **"Logs"**

### 6.2 Deploy automático (CI/CD)
1. En **"Settings"** → **"Auto Deploy"**
2. Habilitar **"Deploy on push"**
3. Cada push a `main` disparará un nuevo deploy

---

## Paso 7: Verificación

### 7.1 Verificar que la app está corriendo
```bash
curl -I https://tu-dominio.com/
```

Deberías ver headers como:
```
HTTP/2 200
x-frame-options: DENY
x-content-type-options: nosniff
strict-transport-security: max-age=31536000; includeSubDomains
```

### 7.2 Verificar página de tracking
1. Acceder a `https://tu-dominio.com/tracking`
2. Buscar una orden existente

### 7.3 Verificar login
1. Acceder a `https://tu-dominio.com/login`
2. Iniciar sesión con credenciales existentes

---

## Troubleshooting

### Error: "Module not found: lightningcss"
El Dockerfile ya incluye la instalación de `lightningcss-linux-x64-gnu`. Si persiste:
1. Verificar que `.dockerignore` no excluya archivos necesarios
2. Limpiar caché de Dokploy y re-deployar

### Error: "NEXT_PUBLIC_* undefined"
Las variables `NEXT_PUBLIC_*` deben estar en **Build Arguments**, no solo en Environment Variables.

### Error: "Health check failed"
1. Verificar que el puerto 3000 está expuesto
2. Revisar logs del container para errores de startup

---

## Resumen de Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Build multi-stage con health check |
| `.dockerignore` | Optimiza contexto de build |
| `.env.example` | Documenta variables requeridas |
| `next.config.js` | Headers de seguridad |
