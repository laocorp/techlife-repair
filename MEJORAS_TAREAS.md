# Plan de Mejora – techlife-repair (RepairApp v2)

## ✅ Mejoras Visuales y UX
- [x] Refinar modo oscuro: paleta de colores, transiciones suaves y consistencia en todos los componentes.
- [x] Añadir micro‑interacciones animadas (hover, focus, carga) usando Framer Motion.
- [ ] Rediseñar layout responsivo: optimizar breakpoints para tablets y monitores grandes, tipografía fluida.
- [x] Reemplazar iconos por un set SVG premium y coherente.
- [x] Rediseñar el dashboard: tarjetas con gráficos (Recharts) y KPI destacados.

## ⚙️ Mejoras Técnicas y de Rendimiento
- [ ] Implementar code‑splitting y lazy loading mediante imports dinámicos.
- [ ] Optimizar imágenes con el componente `next/image`, conversión a WebP y carga diferida.
- [ ] Añadir estrategia de caché SSR con Incremental Static Regeneration (ISR) para páginas públicas.

## 🔐 Seguridad y Fiabilidad
- [ ] Mejorar guardia de autenticación: habilitar MFA para administradores y endurecer políticas RLS de Supabase.
- [ ] Configurar CSP estricta y usar Helmet para protección XSS y otras vulnerabilidades.

## 🚀 Despliegue en Dokploy & GitHub
- [ ] Crear repositorio GitHub llamado **techlife-repair** y subir el código.
- [ ] Configurar GitHub Actions para CI/CD: build, test, crear imagen Docker y publicar en Dokploy.
- [ ] Definir variables de entorno (Supabase URL/Key, NEXT_PUBLIC_…) en Dokploy.
- [ ] Automatizar despliegue sin downtime con health checks y rollout progresivo.
