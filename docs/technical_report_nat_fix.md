# 📄 Informe Técnico: Solución de Conectividad Interna en Entorno NAT

**Fecha:** 22 de Diciembre, 2025  
**Asunto:** Resolución de fallo de comunicación entre contenedores (n8n, NocoDB, Dokploy) debido a restricciones de NAT.  
**Entorno:** Proxmox VE (Red Ruteada/NAT) + Dokploy.

---

## 1. El Problema Identificado

Las aplicaciones desplegadas dentro del servidor (como **n8n**) intentaban conectarse a otros servicios internos (como **NocoDB**) utilizando sus nombres de dominio públicos (ej. `nocodb.amai.run`).

Al intentar establecer la conexión, se producían errores de **Connection Refused** o **Timeout**.

### Diagnóstico de la Causa Raíz: "Hairpin NAT"
El fallo se debe a una limitación de redes conocida como falta de **Hairpin NAT** (o NAT Loopback) en la configuración de red Ruteada:

1.  **Salida:** El contenedor (`n8n`) resolvía el dominio `nocodb.amai.run` a la **IP Pública** del servidor (`5.9.97.242`).
2.  **Bloqueo:** El paquete salía hasta el router/firewall del Host. El router detectaba que la IP de destino era él mismo. En configuraciones de seguridad estricta (como la que hemos implementado para evitar bloqueos de Hetzner), el router **no permite** que el tráfico que sale por la interfaz pública "dé la vuelta" y vuelva a entrar por la misma interfaz.
3.  **Resultado:** El paquete se descartaba, rompiendo la comunicación.

---

## 2. El Intento Fallido Anterior

Se encontró una configuración en el archivo `/etc/hosts` que intentaba solucionar esto apuntando los dominios a `127.0.0.1`:

```plaintext
127.0.0.1  nocodb.amai.run
```

### ¿Por qué falló esto?
En un entorno de contenedores (Docker/LXC), `127.0.0.1` (**Localhost**) hace referencia exclusivamente al **propio contenedor** donde se ejecuta el comando.

*   Cuando **n8n** buscaba `nocodb.amai.run`, el sistema le decía: *"Llama a tu propio localhost"*.
*   **n8n** se llamaba a sí mismo, no encontraba a NocoDB escuchando en su propio puerto interno, y la conexión fallaba.

---

## 3. La Solución Implementada: "Split-Horizon DNS Manual"

Se aplicó una técnica conocida como **Split-Horizon** (Horizonte Dividido) mediante la edición del archivo `/etc/hosts` del contenedor principal de Dokploy.

**Acción realizada:** Se editaron las entradas DNS locales para forzar que los dominios apunten a la **IP Privada de la Red Interna (LAN)**.

**Configuración aplicada en `/etc/hosts`:**

```plaintext
10.0.0.242   dokploy.amai.run n8n.amai.run nocodb.amai.run traefik.amai.run
```

---

## 4. ¿Por qué esta solución es la correcta?

Al apuntar los dominios a la **IP Privada** (`10.0.0.242`), logramos tres beneficios críticos:

1.  **Ruteo Directo (Bypass de Internet):** Cuando n8n busca el dominio, el sistema operativo mira primero el archivo `/etc/hosts`. Al encontrar la IP `10.0.0.242`, envía el tráfico directamente a través del puente de red interno (`vmbr0` o red Docker), **sin salir nunca a Internet** ni tocar la interfaz pública.
2.  **Velocidad y Latencia:** La comunicación ocurre a la velocidad de la memoria/CPU del servidor (Gigabits por segundo), sin la latencia de salir a un router externo.
3.  **Independencia:** Los servicios siguen funcionando entre ellos incluso si la conexión a Internet del servidor se cae, ya que la resolución es totalmente local.

### Resumen Gráfico del Flujo

*   **Antes (Roto):** `n8n` ➔ IP Pública ➔ Firewall (Bloqueo) ❌
*   **Ahora (Corregido):** `n8n` ➔ IP Privada (`10.0.0.242`) ➔ Red Interna ➔ NocoDB ✅

---

> [!IMPORTANT]
> **Recomendación Futura:** Si añades nuevos servicios o subdominios en Dokploy que necesiten hablar entre ellos, debes recordar añadirlos a esta línea en el archivo `/etc/hosts` para asegurar su conectividad interna.
