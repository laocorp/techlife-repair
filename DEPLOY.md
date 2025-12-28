# Guía de Despliegue - TechLife Repair (RepairApp v2)

Este proyecto utiliza **Next.js 15 (App Router)**, **Prisma ORM** y **PostgreSQL**. Esta optimizado para desplegarse mediante Docker (Dokploy, Portainer, Coolify, etc.).

## 🚀 Requisitos Previos

1.  **Base de Datos PostgreSQL**: (Recomendado Supabase).
2.  **Environment Variables**: Necesarias para la construcción y ejecución.

## 📦 Variables de Entorno

Configura estas variables en tu panel de despliegue (Dokploy/GitHub Secrets):

| Variable | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Requerido**. URL de conexión a la BD (Transaction/Session Pool). | `postgresql://postgres:[PASSWORD]@db.supabase.co:5432/postgres` |
| `NEXT_PUBLIC_APP_URL` | **Requerido**. URL pública de la aplicación. | `https://repair.laocorp.lat` |
| `NEXTAUTH_SECRET` | **Requerido**. Clave secreta para firmar tokens JWT (32+ caracteres). | `openssl rand -base64 32` |
| `NODE_ENV` | Entorno de ejecución. | `production` |

> **Nota para Prisma**: La migración de base de datos se debe realizar manualmente o vía CI/CD antes o durante el despliegue con `npx prisma db push` (o `migrate deploy` si usas migraciones).

## 🛠️ Despliegue con GitHub Actions

El repositorio incluye un workflow en `.github/workflows/docker-build.yml` que:
1.  Construye la imagen Docker.
2.  La publica en GitHub Container Registry (GHCR).

### Configuración en GitHub
Ve a `Settings > Secrets and variables > Actions` y añade:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

## 🐳 Despliegue Manual con Docker

1.  **Construir imagen**:
    ```bash
    docker build -t repairapp . \
      --build-arg DATABASE_URL="postgresql://..." \
      --build-arg NEXTAUTH_SECRET="secret..."
    ```

2.  **Ejecutar contenedor**:
    ```bash
    docker run -d -p 3000:3000 \
      -e DATABASE_URL="postgresql://..." \
      -e NEXTAUTH_SECRET="secret..." \
      repairapp
    ```
