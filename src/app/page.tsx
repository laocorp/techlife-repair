import Link from 'next/link'
import Image from 'next/image'
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
  X,
  Building2,
  Wrench,
  BarChart3,
  Cpu,
  Globe,
  Lock
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"></div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Wrench className="h-5 w-5 text-primary-foreground absolute" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              TechRepair
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['Características', 'Precios', 'Contacto'].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5 px-3 py-2 rounded-md"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex hover:bg-primary/5 text-muted-foreground hover:text-primary">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:opacity-90 transition-all hover:scale-105">
                Empezar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-30 -z-10 pointer-events-none" />

        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-primary">Plataforma #1 para gestión técnica</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Gestiona tu servicio técnico <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-primary/50 animate-gradient">
              a nivel experto
            </span>
          </h1>

          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Maximiza la eficiencia de tu taller con la plataforma todo-en-uno definitiva.
            Controla órdenes, inventario y facturación sin complicaciones.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90 rounded-full transition-all hover:scale-105">
                Comenzar prueba gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full border-border/60 hover:bg-background/80 hover:border-primary/50 transition-all backdrop-blur-sm">
                Ver demostración
              </Button>
            </Link>
          </div>

          <div className="mt-16 relative mx-auto max-w-5xl animate-in fade-in zoom-in duration-1000 delay-500">
            <div className="aspect-[16/9] rounded-2xl bg-gradient-to-tr from-muted/50 to-muted/20 border border-border/50 p-2 shadow-2xl backdrop-blur-sm">
              <div className="w-full h-full rounded-xl bg-background overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent z-10 pointer-events-none"></div>
                <Image
                  src="/dashboard-preview.png"
                  alt="TechRepair Dashboard Preview"
                  className="object-cover object-top"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1000px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid Style */}
      <section id="features" className="py-24 px-4 bg-muted/30 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-xl mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Poder absoluto para tu taller
            </h2>
            <p className="text-xl text-muted-foreground">
              Hemos diseñado cada herramienta pensando en las necesidades reales del servicio técnico moderno.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
            {/* Large Feature 1 */}
            <div className="md:col-span-2 row-span-2 overflow-hidden rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="p-8 h-full flex flex-col">
                <div className="mb-auto">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Control Total de Órdenes</h3>
                  <p className="text-muted-foreground text-lg">
                    Desde la recepción hasta la entrega. Gestiona estados, prioridades y asignaciones con un sistema drag-and-drop intuitivo y notificaciones en tiempo real.
                  </p>
                </div>
                <div className="mt-8 rounded-xl bg-gradient-to-br from-muted/50 to-muted/10 border border-border/30 h-64 w-full relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                  {/* Abstract UI representation */}
                  <div className="absolute top-6 left-6 right-0 bottom-0 bg-background rounded-tl-xl shadow-2xl border border-border p-4">
                    <div className="space-y-3">
                      <div className="h-2 w-1/3 bg-muted rounded-full"></div>
                      <div className="h-8 bg-primary/5 rounded-lg w-full"></div>
                      <div className="h-8 bg-muted/30 rounded-lg w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-500 p-8 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Facturación Integrada</h3>
              <p className="text-muted-foreground">Convierte órdenes en facturas con un clic. Compatible con requisitos fiscales locales.</p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-500 p-8 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Inventario Inteligente</h3>
              <p className="text-muted-foreground">Control de stock en tiempo real, alertas automáticas y trazabilidad de repuestos.</p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-500 p-8 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">CRM Potente</h3>
              <p className="text-muted-foreground">Historial completo de clientes, equipos y reparaciones previas al instante.</p>
            </div>

            {/* Wide Feature */}
            <div className="md:col-span-3 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-500 p-8 flex flex-col md:flex-row items-center gap-8 group">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Escala sin Límites</h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Ya sea que tengas una sucursal o una cadena nacional, nuestra arquitectura multi-tenant crece contigo. Gestiona múltiples ubicaciones desde un solo panel.
                </p>
                <div className="flex flex-wrap gap-2 text-sm font-medium">
                  <span className="px-3 py-1 rounded-full bg-secondary/50 border border-border">Multi-sucursal</span>
                  <span className="px-3 py-1 rounded-full bg-secondary/50 border border-border">Roles y Permisos</span>
                  <span className="px-3 py-1 rounded-full bg-secondary/50 border border-border">API Disponible</span>
                </div>
              </div>
              <div className="flex-1 w-full relative h-48 rounded-2xl overflow-hidden border border-border/50 bg-muted/20">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                {/* Map or scaling visual placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-4 opacity-50">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="w-12 h-12 rounded-lg bg-background border border-border shadow-sm"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Dynamic */}
      <section id="pricing" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full -z-10" />

        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Inversión Transparente</h2>
            <p className="text-xl text-muted-foreground">
              Sin costos ocultos ni contratos forzosos. Comienza gratis y escala cuando lo necesites.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {plans.map((plan, index) => {
              const isPopular = index === 1
              const planModules = plan.features?.modules || []
              const allModules = [
                { id: 'clients', label: 'Gestión de Clientes' },
                { id: 'work_orders', label: 'Órdenes de Trabajo' },
                { id: 'reports', label: 'Informes en PDF' },
                { id: 'inventory', label: 'Control de Inventario' },
                { id: 'invoices', label: 'Facturación Electrónica' },
                { id: 'accounting', label: 'Contabilidad Básica' },
              ]

              return (
                <div
                  key={plan.id}
                  className={`
                    relative rounded-[2rem] p-8 border backdrop-blur-md transition-all duration-300
                    ${isPopular
                      ? 'border-primary shadow-2xl shadow-primary/20 bg-background/80 z-10 md:-mt-8 md:-mb-8'
                      : 'border-border/50 bg-background/40 hover:bg-background/60 hover:border-border/80'}
                  `}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      Más Elegido
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">
                      {plan.max_users === -1 ? 'Para grandes empresas' : 'Ideal para empezar'}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{formatCurrency(plan.price_monthly)}</span>
                      <span className="text-muted-foreground">/mes</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Facturado anualmente ({formatCurrency(plan.price_yearly)})
                    </p>
                  </div>

                  <div className="h-px w-full bg-border/50 mb-8"></div>

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {plan.max_users === -1 ? 'Usuarios Ilimitados' : `${plan.max_users} Usuarios`}
                      </span>
                    </li>
                    {allModules.map((module) => {
                      const isIncluded = planModules.includes(module.id)
                      return (
                        <li key={module.id} className="flex items-center gap-3">
                          {isIncluded ? (
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <X className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                          <span className={`text-sm ${isIncluded ? 'text-foreground' : 'text-muted-foreground/50 line-through'}`}>
                            {module.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  <Link href="/register">
                    <Button
                      className={`w-full rounded-xl h-12 text-base font-medium ${isPopular ? 'shadow-lg shadow-primary/25' : ''}`}
                      variant={isPopular ? 'default' : 'secondary'}
                    >
                      Seleccionar Plan
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="relative rounded-[3rem] overflow-hidden bg-foreground text-background px-6 py-20 text-center">

            {/* Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
              <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] rounded-full bg-primary blur-[150px]"></div>
              <div className="absolute bottom-[-50%] right-[-20%] w-[800px] h-[800px] rounded-full bg-blue-600 blur-[150px]"></div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                ¿Listo para profesionalizar tu taller?
              </h2>
              <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto">
                Únete a la comunidad de técnicos que ya han transformado su gestión.
                Sin tarjetas de crédito. Cancela cuando quieras.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-background text-foreground hover:bg-background/90 font-semibold shadow-xl">
                    Comenzar Gratis Ahora
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground/60 pt-4">
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> 14 días de prueba</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Soporte 24/7</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Configuración instantánea</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-lg pt-16 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1 space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">TechRepair</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La plataforma estándar para la gestión profesional de servicios técnicos en Latinoamérica.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors cursor-pointer">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Características</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Precios</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Integraciones</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Roadmap</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Compañía</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Sobre Nosotros</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Carreras</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contacto</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacidad</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Términos de servicio</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Seguridad</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} TechRepair Inc. Todos los derechos reservados.</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Todos los sistemas operativos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
