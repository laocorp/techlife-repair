import Link from 'next/link'
import { Button } from '@/components/ui'
import {
  ClipboardList,
  Users,
  Package,
  Receipt,
  Shield,
  Zap,
  ArrowRight,
  Check,
  Building2,
  Wrench
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-base font-bold text-primary-foreground">TR</span>
            </div>
            <span className="text-xl font-semibold text-foreground">TechRepair</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
              Características
            </Link>
            <Link href="#pricing" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
              Precios
            </Link>
            <Link href="#contact" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
              Contacto
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>
                Empezar Gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary px-4 py-1.5 mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground-secondary">Plataforma #1 para servicio técnico</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-tight">
            Gestiona tu empresa de{' '}
            <span className="text-primary">servicio técnico</span>{' '}
            como un profesional
          </h1>

          <p className="mt-6 text-lg md:text-xl text-foreground-secondary max-w-2xl mx-auto">
            Órdenes de trabajo, inventario, facturación y contabilidad. Todo en una sola plataforma diseñada para empresas de servicio técnico.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Comenzar prueba gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg">
                Ver demostración
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-foreground-muted">
            14 días de prueba gratis • Sin tarjeta de crédito
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-background-secondary">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Todo lo que necesitas para crecer
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Herramientas profesionales para gestionar cada aspecto de tu negocio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ClipboardList,
                title: 'Órdenes de Trabajo',
                description: 'Crea, asigna y da seguimiento a todas tus órdenes. Notifica a tus técnicos automáticamente.',
              },
              {
                icon: Wrench,
                title: 'Informes Técnicos',
                description: 'Documenta diagnósticos, trabajos realizados y recomendaciones. Exporta a PDF profesional.',
              },
              {
                icon: Package,
                title: 'Inventario Inteligente',
                description: 'Control de stock, manejo de seriales y alertas de bajo inventario. Todo automatizado.',
              },
              {
                icon: Receipt,
                title: 'Facturación',
                description: 'Genera facturas desde órdenes de trabajo. Control de cuentas por cobrar y pagos.',
              },
              {
                icon: Users,
                title: 'Gestión de Clientes',
                description: 'Base de datos completa con historial de servicios, datos fiscales y contactos.',
              },
              {
                icon: Shield,
                title: 'Multi-empresa',
                description: 'Gestiona múltiples sucursales o empresas desde una sola cuenta centralizada.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-background-tertiary p-6 transition-all hover:border-primary/30 hover:shadow-card"
              >
                <div className="h-12 w-12 rounded-lg bg-primary-light flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-foreground-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Precios simples y transparentes
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Elige el plan que mejor se adapte a tu negocio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$29',
                description: 'Para equipos pequeños',
                features: [
                  'Hasta 3 usuarios',
                  '50 clientes',
                  'Órdenes de trabajo',
                  'Informes técnicos',
                  'Soporte por email',
                ],
              },
              {
                name: 'Profesional',
                price: '$59',
                description: 'Para empresas en crecimiento',
                popular: true,
                features: [
                  'Hasta 10 usuarios',
                  '200 clientes',
                  'Todo lo de Starter',
                  'Inventario completo',
                  'Facturación',
                  'Soporte prioritario',
                ],
              },
              {
                name: 'Enterprise',
                price: '$99',
                description: 'Para grandes operaciones',
                features: [
                  'Usuarios ilimitados',
                  'Clientes ilimitados',
                  'Todo lo de Profesional',
                  'Contabilidad básica',
                  'API access',
                  'Soporte dedicado',
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-8 ${plan.popular
                    ? 'border-primary bg-primary-light shadow-lg scale-105'
                    : 'border-border bg-background-tertiary'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Más popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-foreground-secondary">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-foreground-secondary">/mes</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span className="text-foreground-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block">
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'primary' : 'outline'}
                  >
                    Empezar ahora
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Únete a cientos de empresas que ya usan TechRepair para gestionar su servicio técnico
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                Comenzar prueba gratuita
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">TR</span>
                </div>
                <span className="text-lg font-semibold text-foreground">TechRepair</span>
              </Link>
              <p className="mt-3 text-sm text-foreground-muted max-w-xs">
                La plataforma más completa para gestionar tu empresa de servicio técnico.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Producto</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="#features" className="text-foreground-secondary hover:text-foreground">Características</Link></li>
                  <li><Link href="#pricing" className="text-foreground-secondary hover:text-foreground">Precios</Link></li>
                  <li><Link href="#" className="text-foreground-secondary hover:text-foreground">Actualizaciones</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Empresa</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="#" className="text-foreground-secondary hover:text-foreground">Sobre nosotros</Link></li>
                  <li><Link href="#" className="text-foreground-secondary hover:text-foreground">Blog</Link></li>
                  <li><Link href="#contact" className="text-foreground-secondary hover:text-foreground">Contacto</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/terms" className="text-foreground-secondary hover:text-foreground">Términos</Link></li>
                  <li><Link href="/privacy" className="text-foreground-secondary hover:text-foreground">Privacidad</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between gap-4 text-sm text-foreground-muted">
            <p>© {new Date().getFullYear()} TechRepair. Todos los derechos reservados.</p>
            <p>Hecho con ❤️ para empresas de servicio técnico</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
