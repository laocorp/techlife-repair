import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui'
import {
  Check,
  X,
  Wrench,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Users,
  BarChart3,
  Smartphone,
  ChevronRight,
  Mail,
  MessageSquare,
  FileText
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

async function getPlans() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true })
    .limit(3)

  return plans || []
}

export default async function LandingPage() {
  const plans = await getPlans()

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 antialiased">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-zinc-900" />
            </div>
            <span className="font-medium text-sm">TechRepair</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-xs text-zinc-500 hover:text-zinc-100 transition-colors">
              Características
            </Link>
            <Link href="#pricing" className="text-xs text-zinc-500 hover:text-zinc-100 transition-colors">
              Precios
            </Link>
            <Link href="#faq" className="text-xs text-zinc-500 hover:text-zinc-100 transition-colors">
              FAQ
            </Link>
            <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-100 transition-colors">
              Iniciar Sesión
            </Link>
          </div>

          <Link href="/register">
            <Button className="h-7 px-3 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-300 rounded-md font-medium">
              Comenzar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 text-xs text-zinc-500 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            En producción
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.15] mb-5">
            El software que tu
            <br />
            servicio técnico merece
          </h1>

          <p className="text-base text-zinc-500 max-w-lg mx-auto mb-8 leading-relaxed">
            Gestiona órdenes, inventario y clientes en una plataforma
            diseñada para la velocidad y simplicidad.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-9 px-5 text-sm bg-zinc-100 text-zinc-900 hover:bg-zinc-300 rounded-md font-medium inline-flex items-center gap-2">
                Comenzar gratis
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="#demo" className="text-sm text-zinc-500 hover:text-zinc-100 transition-colors">
              Ver demo →
            </Link>
          </div>
        </div>
      </section>

      {/* Product Screenshot */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg overflow-hidden bg-zinc-900">
            <div className="aspect-[16/10] relative">
              <Image
                src="/dashboard-preview.png"
                alt="TechRepair Dashboard"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Talleres activos' },
              { value: '50k+', label: 'Órdenes procesadas' },
              { value: '99.9%', label: 'Uptime' },
              { value: '<1s', label: 'Tiempo de carga' }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-semibold mb-1">{stat.value}</div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
              Todo lo que necesitas
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Herramientas construidas para equipos de servicio técnico modernos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: 'Órdenes de trabajo',
                description: 'Seguimiento completo desde recepción hasta entrega.'
              },
              {
                icon: Smartphone,
                title: 'Inventario',
                description: 'Control de stock en tiempo real con alertas automáticas.'
              },
              {
                icon: Users,
                title: 'Clientes',
                description: 'Historial completo de cada cliente y sus equipos.'
              },
              {
                icon: BarChart3,
                title: 'Reportes',
                description: 'Métricas y dashboards para tomar mejores decisiones.'
              },
              {
                icon: Shield,
                title: 'Seguridad',
                description: 'Encriptación de datos y backups automáticos.'
              },
              {
                icon: Zap,
                title: 'Integraciones',
                description: 'WhatsApp, facturación electrónica y más.'
              }
            ].map((feature) => (
              <div key={feature.title}>
                <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center mb-3">
                  <feature.icon className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-medium mb-1.5">{feature.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
              Cómo funciona
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Empieza a gestionar tu taller en minutos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Crea tu cuenta',
                description: 'Regístrate gratis y configura tu perfil de empresa en menos de 2 minutos.'
              },
              {
                step: '02',
                title: 'Importa tus datos',
                description: 'Sube tu lista de clientes y productos existentes con nuestra herramienta de importación.'
              },
              {
                step: '03',
                title: 'Comienza a gestionar',
                description: 'Crea tu primera orden de trabajo y experimenta la diferencia.'
              }
            ].map((item) => (
              <div key={item.step}>
                <div className="text-xs text-zinc-600 font-mono mb-3">{item.step}</div>
                <h3 className="text-sm font-medium mb-1.5">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
              Lo que dicen nuestros usuarios
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Redujimos el tiempo de gestión de órdenes en un 60%. La interfaz es increíblemente rápida.',
                author: 'Carlos M.',
                role: 'TechService Pro'
              },
              {
                quote: 'Por fin un software que entiende cómo funciona un taller de reparación real.',
                author: 'María L.',
                role: 'Reparaciones Express'
              },
              {
                quote: 'El control de inventario me ha salvado de perder ventas por falta de stock.',
                author: 'Roberto S.',
                role: 'MobileFix'
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-zinc-900 rounded-lg p-5">
                <p className="text-sm text-zinc-300 mb-4 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <div className="text-xs font-medium">{testimonial.author}</div>
                  <div className="text-xs text-zinc-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
              Precios simples
            </h2>
            <p className="text-zinc-500 text-sm">
              Sin contratos. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {plans.map((plan, index) => {
              const isPopular = index === 1
              const planModules = plan.features?.modules || []

              return (
                <div
                  key={plan.id}
                  className={`rounded-lg p-5 ${isPopular
                    ? 'bg-zinc-800'
                    : 'bg-zinc-900'
                    }`}
                >
                  {isPopular && (
                    <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-3">
                      Popular
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="text-base font-medium mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold">{formatCurrency(plan.price_monthly)}</span>
                      <span className="text-zinc-500 text-xs">/mes</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-5">
                    <li className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{plan.max_users === -1 ? 'Usuarios ilimitados' : `${plan.max_users} usuario(s)`}</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Órdenes de trabajo</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Gestión de clientes</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      {planModules.includes('inventory') ? (
                        <Check className="w-3.5 h-3.5 text-zinc-500" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-zinc-700" />
                      )}
                      <span className={!planModules.includes('inventory') ? 'text-zinc-600' : ''}>
                        Inventario
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      {planModules.includes('invoices') ? (
                        <Check className="w-3.5 h-3.5 text-zinc-500" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-zinc-700" />
                      )}
                      <span className={!planModules.includes('invoices') ? 'text-zinc-600' : ''}>
                        Facturación
                      </span>
                    </li>
                  </ul>

                  <Link href="/register" className="block">
                    <Button
                      className={`w-full h-8 text-xs rounded-md font-medium ${isPopular
                        ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-300'
                        : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                        }`}
                    >
                      Comenzar
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-2xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
              Preguntas frecuentes
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Puedo probar antes de pagar?',
                a: 'Sí, ofrecemos 14 días de prueba gratuita con acceso completo a todas las funciones.'
              },
              {
                q: '¿Mis datos están seguros?',
                a: 'Utilizamos encriptación de grado bancario y realizamos backups automáticos cada 24 horas.'
              },
              {
                q: '¿Puedo importar mis datos existentes?',
                a: 'Sí, puedes importar clientes, productos e historial desde archivos Excel o CSV.'
              },
              {
                q: '¿Hay soporte técnico incluido?',
                a: 'Todos los planes incluyen soporte por email. Los planes Pro y Enterprise tienen soporte prioritario.'
              },
              {
                q: '¿Puedo cancelar en cualquier momento?',
                a: 'Sí, sin preguntas. Tu suscripción se cancela inmediatamente y no se te cobra más.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-zinc-900 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">{faq.q}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
            Comienza hoy
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            Únete a cientos de talleres que ya optimizaron su gestión.
          </p>
          <Link href="/register">
            <Button className="h-9 px-6 text-sm bg-zinc-100 text-zinc-900 hover:bg-zinc-300 rounded-md font-medium">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto">

          {/* Top */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <span className="font-medium text-sm">TechRepair</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mb-4">
                La plataforma de gestión para servicios técnicos modernos.
                Simple, rápida y confiable.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-zinc-600 hover:text-zinc-400 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </a>
                <a href="#" className="text-zinc-600 hover:text-zinc-400 transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-medium mb-4">Producto</h4>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li><Link href="#features" className="hover:text-zinc-100 transition-colors">Características</Link></li>
                <li><Link href="#pricing" className="hover:text-zinc-100 transition-colors">Precios</Link></li>
                <li><Link href="#" className="hover:text-zinc-100 transition-colors">Changelog</Link></li>
                <li><Link href="#" className="hover:text-zinc-100 transition-colors">Roadmap</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-medium mb-4">Recursos</h4>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li><Link href="#" className="hover:text-zinc-100 transition-colors">Documentación</Link></li>
                <li><Link href="#" className="hover:text-zinc-100 transition-colors">Guías</Link></li>
                <li><Link href="#" className="hover:text-zinc-100 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-zinc-100 transition-colors">Soporte</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-medium mb-4">Compañía</h4>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li><Link href="#" className="hover:text-zinc-100 transition-colors">Nosotros</Link></li>
                <li><Link href="/privacy" className="hover:text-zinc-100 transition-colors">Privacidad</Link></li>
                <li><Link href="/terms" className="hover:text-zinc-100 transition-colors">Términos</Link></li>
                <li><Link href="#" className="hover:text-zinc-100 transition-colors">Contacto</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
            <div className="flex items-center gap-3">
              <span>© {new Date().getFullYear()} TechRepair</span>
              <span className="text-zinc-700">•</span>
              <span>Desarrollado por <a href="https://laocorp.lat" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-100 transition-colors">LAOCORP</a> — Agencia de IA en Ecuador</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Todos los sistemas operativos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
