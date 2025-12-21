import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    Mail,
    Phone,
    MapPin,
    ChevronRight,
} from 'lucide-react'

const features = [
    {
        icon: Wrench,
        title: 'Órdenes de Servicio',
        description: 'Gestiona reparaciones con informes técnicos detallados, seguimiento QR y notificaciones automáticas.',
    },
    {
        icon: Receipt,
        title: 'Facturación SRI',
        description: 'Facturación electrónica integrada con el SRI Ecuador. Emisión automática y validación en tiempo real.',
    },
    {
        icon: BarChart3,
        title: 'Punto de Venta',
        description: 'POS completo con inventario, caja, múltiples métodos de pago y reportes de ventas.',
    },
    {
        icon: Shield,
        title: 'Multi-Empresa',
        description: 'Datos completamente aislados por empresa. Perfecto para franquicias y múltiples sucursales.',
    },
    {
        icon: Smartphone,
        title: 'Funciona Offline',
        description: 'Continúa trabajando sin internet. Los datos se sincronizan automáticamente al reconectar.',
    },
    {
        icon: Users,
        title: 'Portal de Clientes',
        description: 'Tus clientes pueden ver el estado de sus reparaciones, historial y pagos pendientes.',
    },
]

const brands = ['Bosch', 'Emtop', 'Total', 'Sweiss', 'Esii', 'Growan', 'Dewalt', 'Makita']

const testimonials = [
    {
        name: 'Carlos Mendoza',
        role: 'Gerente, TecniHerramientas EC',
        content: 'RepairApp transformó nuestro taller. Ahora procesamos el doble de órdenes con menos errores.',
        rating: 5,
        initials: 'CM',
    },
    {
        name: 'María Fernández',
        role: 'Propietaria, ServiFix',
        content: 'La integración con el SRI nos ahorra horas de trabajo. La facturación es automática y sin complicaciones.',
        rating: 5,
        initials: 'MF',
    },
    {
        name: 'Roberto Sánchez',
        role: 'Director, ToolService Pro',
        content: 'El portal de clientes ha mejorado enormemente nuestra comunicación. Los clientes están más satisfechos.',
        rating: 5,
        initials: 'RS',
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
        <div className="min-h-screen bg-white text-slate-900">
            {/* Navigation - Professional & Clean */}
            <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-slate-900">RepairApp</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                Características
                            </Link>
                            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                Precios
                            </Link>
                            <Link href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                Testimonios
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                                    Iniciar sesión
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                                    Prueba Gratis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Clean & Professional */}
            <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-8">
                        <Zap className="w-4 h-4" />
                        Nuevo: Portal de Clientes con QR
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight text-slate-900">
                        El sistema completo para
                        <span className="block text-slate-900">Servicios Técnicos</span>
                    </h1>

                    <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Gestiona órdenes de servicio, facturación electrónica SRI, inventario, POS y más.
                        Todo en una plataforma diseñada para Ecuador.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="h-12 px-8 text-base bg-slate-900 hover:bg-slate-800 text-white gap-2">
                                Comenzar Gratis
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Link href="/tracking">
                            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-slate-300 text-slate-700 hover:bg-slate-50 gap-2">
                                Ver Demo
                            </Button>
                        </Link>
                    </div>

                    {/* Brands */}
                    <div className="mt-20">
                        <p className="text-sm text-slate-500 mb-6">
                            Usado por servicios técnicos autorizados de
                        </p>
                        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
                            {brands.map((brand) => (
                                <span
                                    key={brand}
                                    className="text-xl font-semibold text-slate-300"
                                >
                                    {brand}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Todo lo que necesitas
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                            Una plataforma completa para gestionar tu servicio técnico de principio a fin
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => {
                            const Icon = feature.icon
                            return (
                                <Card key={feature.title} className="border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 bg-white">
                                    <CardContent className="p-6">
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                                            <Icon className="w-6 h-6 text-slate-700" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2 text-slate-900">{feature.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">
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
            <section id="pricing" className="py-24 px-4 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Planes simples y transparentes
                        </h2>
                        <p className="mt-4 text-lg text-slate-600">
                            Comienza gratis por 14 días. Sin tarjeta de crédito.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {pricingPlans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={`relative bg-white border ${plan.popular ? 'border-slate-900 shadow-xl scale-105' : 'border-slate-200'}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-slate-900 text-white text-xs font-medium px-3 py-1 rounded-full">
                                            Más Popular
                                        </span>
                                    </div>
                                )}
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                                    <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
                                    <div className="mt-6">
                                        <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                                        <span className="text-slate-500">/mes</span>
                                    </div>
                                    <ul className="mt-6 space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className={`w-full mt-6 ${plan.popular
                                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
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
            <section id="testimonials" className="py-24 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Lo que dicen nuestros clientes
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial) => (
                            <Card key={testimonial.name} className="border border-slate-200 bg-white">
                                <CardContent className="p-6">
                                    <div className="flex gap-1 mb-4">
                                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                                    <div className="flex items-center gap-3 mt-6">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                                            {testimonial.initials}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{testimonial.name}</p>
                                            <p className="text-sm text-slate-500">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 bg-slate-900">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Comienza hoy mismo
                    </h2>
                    <p className="text-slate-400 mb-8 max-w-xl mx-auto text-lg">
                        Prueba RepairApp gratis por 14 días. Sin tarjeta de crédito requerida.
                    </p>
                    <Link href="/register">
                        <Button size="lg" className="h-12 px-8 text-base bg-white text-slate-900 hover:bg-slate-100 gap-2">
                            Crear Cuenta Gratis
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
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
                </div>
            </section>

            {/* Footer - Professional */}
            <footer className="bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
                                    <Wrench className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">RepairApp</span>
                            </div>
                            <p className="text-slate-600 text-sm max-w-sm">
                                Sistema integral de gestión para servicios técnicos.
                                Facturación electrónica SRI Ecuador, órdenes de servicio,
                                inventario y punto de venta.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4">Producto</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="#features" className="text-slate-600 hover:text-slate-900">Características</Link></li>
                                <li><Link href="#pricing" className="text-slate-600 hover:text-slate-900">Precios</Link></li>
                                <li><Link href="/tracking" className="text-slate-600 hover:text-slate-900">Tracking</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4">Contacto</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2 text-slate-600">
                                    <Mail className="w-4 h-4" />
                                    soporte@repairapp.ec
                                </li>
                                <li className="flex items-center gap-2 text-slate-600">
                                    <Phone className="w-4 h-4" />
                                    +593 99 999 9999
                                </li>
                                <li className="flex items-center gap-2 text-slate-600">
                                    <MapPin className="w-4 h-4" />
                                    Ecuador
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500">
                            © 2024 RepairApp. Todos los derechos reservados.
                        </p>
                        <div className="flex gap-6 text-sm text-slate-500">
                            <Link href="/terminos" className="hover:text-slate-900">Términos</Link>
                            <Link href="/privacidad" className="hover:text-slate-900">Privacidad</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
