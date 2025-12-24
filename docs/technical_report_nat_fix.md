# 📑 Informe Técnico: Infraestructura de Red y Arquitectura DNS (Split-Horizon)

**Fecha:** 23 de Diciembre, 2025
**Proyecto:** Infraestructura de Servidor Proxmox (Hetzner)
**Autor:** Departamento de TI - TECHLIFE
**Estado:** ✅ Implementado y Operativo

---

## 1. Resumen Ejecutivo
Se ha completado la reestructuración de la red del servidor para cumplir con las normativas de seguridad del proveedor (Hetzner) y optimizar la comunicación interna.

Se implementó una arquitectura **NAT Ruteada** acompañada de un servicio **DNS Split-Horizon (dnsmasq)**. Esto permite que los contenedores (Dokploy, HestiaCP, n8n) se comuniquen entre sí a velocidad de red local (<1ms) utilizando sus dominios públicos, eliminando errores de conectividad y latencia.

---

## 2. Antecedentes y Problemática
* **Restricción:** Hetzner bloquea tráfico proveniente de direcciones MAC virtuales no autorizadas (MAC Abuse).
* **Solución de Red:** Se configuró el Host Proxmox como un Router NAT (`vmbr0`), ocultando toda la red interna (`10.0.0.0/24`) detrás de la IP física del servidor.
* **Conflicto Resultante (Hairpin NAT):** Al estar detrás de NAT, los contenedores perdieron la capacidad de accederse a sí mismos usando la IP Pública, causando errores `ECONNREFUSED` en aplicaciones críticas (ej. n8n conectando a NocoDB).

---

## 3. Solución Implementada: DNS Centralizado (dnsmasq)
Para resolver el conflicto de conectividad, se desplegó un servidor DNS ligero (`dnsmasq`) en el Host.

### Arquitectura Lógica
1.  **Gateway DNS:** El Host Proxmox (`10.0.0.1`) actúa como Servidor DNS autoritativo.
2.  **Resolución Inteligente (Split-Horizon):**
    * **Consulta Interna:** Si un contenedor busca un dominio propio (ej. `n8n.amai.run`), recibe la **IP Privada** (`10.0.0.x`).
    * **Consulta Externa:** Si busca internet (ej. `google.com`), la consulta se reenvía a `8.8.8.8`.

---

## 4. Configuración Técnica Detallada

### A. Configuración del Servidor (Host Proxmox)
* **Servicio:** dnsmasq
* **Archivo:** `/etc/dnsmasq.conf`

**Mapa de Enrutamiento:**

| Servicio / Cliente | IP Destino (LAN) | Dominios Configurados |
| :--- | :--- | :--- |
| **Dokploy Principal** | `10.0.0.242` | `n8n.amai.run`, `nocodb.amai.run`, `ameran-ia.com`, `djadrii.com`, `jardineriajotargon.com`, `jardineriapevastar.com`, `jardineriajofeva.es`, `superclevr.com`, `craispain.es`, `ingenier-ia.eu` |
| **Dokploy Cliente 01** | `10.0.0.210` | `gcmasesores.io` |
| **HestiaCP** | `10.0.0.241` | `host.amai.run`, `webmail.*` |

### B. Configuración de Clientes
1.  **Nivel Sistema (LXC):** DNS Server configurado a `10.0.0.1` en Proxmox.
2.  **Nivel Aplicación (Docker):** Archivo `/etc/docker/daemon.json` configurado con `"dns": ["10.0.0.1", "8.8.8.8"]`.

---

## 5. Resultados y Beneficios
1.  **Seguridad:** Tráfico interno aislado de Internet. Cumplimiento total de normas MAC.
2.  **Rendimiento:** Latencia reducida de ~30ms a **~0.03ms**.
3.  **Estabilidad:** Eliminación de errores de conexión y timeouts en flujos de trabajo.
4.  **Escalabilidad:** Gestión centralizada de dominios en un solo archivo.

---

## 6. Procedimiento de Mantenimiento (SOP)

**Para añadir nuevos dominios:**
1.  SSH al Host (`root`).
2.  `nano /etc/dnsmasq.conf`
3.  Añadir: `address=/nuevo-dominio.com/10.0.0.XXX`
4.  `systemctl restart dnsmasq`

---
**Fin del Documento**