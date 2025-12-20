import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Wrench,
    Shield,
    Zap,
    BarChart3,
    Smartphone,
    Receipt,
    Users,
    CheckCircle,
    ArrowRight,
    Star,
    Sparkles,
    Play,
    ChevronRight,
} from 'lucide-react'

const features = [
    {
        icon: Wrench,
        title: 'Órdenes de Servicio',
        description: 'Gestiona reparaciones con informes técnicos detallados, seguimiento QR y notificaciones automáticas.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Receipt,
        title: 'Facturación SRI',
        description: 'Facturación electrónica integrada con el SRI Ecuador. Emisión automática y validación en tiempo real.',
        gradient: 'from-purple-500 to-pink-500',
    },
    {
        icon: BarChart3,
        title: 'Punto de Venta',
        description: 'POS completo con inventario, caja, múltiples métodos de pago y reportes de ventas.',
        gradient: 'from-amber-500 to-orange-500',
    },
    {
        icon: Shield,
        title: 'Multi-Empresa',
        description: 'Datos completamente aislados por empresa. Perfecto para franquicias y múltiples sucursales.',
        gradient: 'from-emerald-500 to-teal-500',
    },
    {
        icon: Smartphone,
        title: 'Funciona Offline',
        description: 'Continúa trabajando sin internet. Los datos se sincronizan automáticamente al reconectar.',
        gradient: 'from-red-500 to-rose-500',
    },
    {
        icon: Users,
        title: 'Portal de Clientes',
        description: 'Tus clientes pueden ver el estado de sus reparaciones, historial y pagos pendientes.',
        gradient: 'from-indigo-500 to-violet-500',
    },
]

const brands = ['Bosch', 'Emtop', 'Total', 'Sweiss', 'Esii', 'Growan', 'Dewalt', 'Makita']

const testimonials = [
    {
        name: 'Carlos Mendoza',
        role: 'Gerente, TecniHerramientas EC',
        content: 'RepairApp transformó nuestro taller. Ahora procesamos el doble de órdenes con menos errores.',
        rating: 5,
        image: 'CM',
    },
    {
        name: 'María Fernández',
        role: 'Propietaria, ServiFix',
        content: 'La integración con el SRI nos ahorra horas de trabajo. La facturación es automática y sin complicaciones.',
        rating: 5,
        image: 'MF',
    },
    {
        name: 'Roberto Sánchez',
        role: 'Director, ToolService Pro',
        content: 'El portal de clientes ha mejorado enormemente nuestra comunicación. Los clientes están más satisfechos.',
        rating: 5,
        image: 'RS',
    },
]

const pricingPlans = [
    {
        name: 'Básico',
        price: 29,
        description: 'Perfecto para talleres pequeños',
        features: ['Hasta 2 usuarios', 'Órdenes ilimitadas', 'Facturación SRI', 'Soporte por email'],
        cta: 'Comenzar',
        popular: false,
    },
    {
        name: 'Profesional',
        price: 59,
        description: 'Para talleres en crecimiento',
        features: ['Hasta 10 usuarios', 'Todo del plan Básico', 'Portal de clientes', 'Reportes avanzados', 'Soporte prioritario'],
        cta: 'Comenzar',
        popular: true,
    },
    {
        name: 'Enterprise',
        price: 149,
        description: 'Para grandes operaciones',
        features: ['Usuarios ilimitados', 'Todo del plan Profesional', 'API acceso', 'Multi-sucursal', 'Gerente de cuenta'],
        cta: 'Contactar',
        popular: false,
    },
]

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">RepairApp</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                Características
                            </Link>
                            <Link href="/pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                Precios
                            </Link>
                            <Link href="#testimonials" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                Testimonios
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" className="text-slate-300 hover:text-white">
                                    Iniciar sesión
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25">
                                    Prueba Gratis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <Badge className="mb-6 bg-white/10 text-white border-white/20 py-1.5 px-4 backdrop-blur">
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-400" />
                        Nuevo: Portal de Clientes con QR
                    </Badge>

                    <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                        El sistema completo para
                        <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Servicios Técnicos
                        </span>
                    </h1>

                    <p className="mt-6 text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Gestiona órdenes de servicio, facturación electrónica SRI, inventario, POS y más.
                        Todo en una plataforma diseñada para Ecuador.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl shadow-blue-500/25 gap-2">
                                Comenzar Gratis
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10 gap-2">
                            <Play className="w-5 h-5" />
                            Ver Demo
                        </Button>
                    </div>

                    {/* Brands */}
                    <div className="mt-20">
                        <p className="text-sm text-slate-500 mb-8">
                            Usado por servicios técnicos autorizados de
                        </p>
                        <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
                            {brands.map((brand) => (
                                <span
                                    key={brand}
                                    className="text-2xl font-bold text-slate-700 hover:text-slate-500 transition-colors cursor-default"
                                >
                                    {brand}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
                            Características
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold">
                            Todo lo que necesitas
                        </h2>
                        <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
                            Una plataforma completa para gestionar tu servicio técnico de principio a fin
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => {
                            const Icon = feature.icon
                            return (
                                <Card key={feature.title} className="bg-white/5 border-white/10 backdrop-blur hover:bg-white/10 transition-all duration-300 group">
                                    <CardContent className="p-6">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
                            Precios
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold">
                            Planes simples y transparentes
                        </h2>
                        <p className="mt-4 text-xl text-slate-400">
                            Comienza gratis por 14 días. Sin tarjeta de crédito.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {pricingPlans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={`relative bg-white/5 border-white/10 backdrop-blur ${plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-white">
                                            Más Popular
                                        </Badge>
                                    </div>
                                )}
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                                    <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                                    <div className="mt-6">
                                        <span className="text-4xl font-bold text-white">${plan.price}</span>
                                        <span className="text-slate-400">/mes</span>
                                    </div>
                                    <ul className="mt-6 space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className={`w-full mt-6 ${plan.popular
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                            : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                    >
                                        {plan.cta}
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="relative py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20">
                            Testimonios
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold">
                            Lo que dicen nuestros clientes
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial) => (
                            <Card key={testimonial.name} className="bg-white/5 border-white/10 backdrop-blur">
                                <CardContent className="p-6">
                                    <div className="flex gap-1 mb-4">
                                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-300 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                                    <div className="flex items-center gap-3 mt-6">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                                            {testimonial.image}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{testimonial.name}</p>
                                            <p className="text-sm text-slate-400">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 overflow-hidden relative">
                        <CardContent className="p-12 text-center relative">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Comienza hoy mismo
                            </h2>
                            <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">
                                Prueba RepairApp gratis por 14 días. Sin tarjeta de crédito requerida.
                            </p>
                            <Link href="/register">
                                <Button size="lg" className="h-14 px-8 text-lg bg-white text-purple-600 hover:bg-white/90 shadow-xl gap-2">
                                    Crear Cuenta Gratis
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/80">
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> 14 días gratis
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Sin tarjeta requerida
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Soporte incluido
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-4 bg-black/20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">RepairApp</span>
                        </div>
                        <p className="text-sm text-slate-500">
                            © 2024 RepairApp. Sistema de Servicio Técnico con Facturación SRI Ecuador.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
