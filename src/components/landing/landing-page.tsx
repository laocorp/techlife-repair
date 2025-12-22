'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    Sparkles,
    Play,
    Check,
    Search,
} from 'lucide-react'

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
}

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } }
}

const features = [
    {
        icon: Wrench,
        title: 'Órdenes de Servicio',
        description: 'Gestiona reparaciones con informes técnicos detallados, seguimiento QR y notificaciones automáticas.',
        gradient: 'from-slate-100 to-slate-50',
    },
    {
        icon: Receipt,
        title: 'Facturación SRI',
        description: 'Facturación electrónica integrada con el SRI Ecuador. Emisión automática y validación en tiempo real.',
        gradient: 'from-slate-100 to-slate-50',
    },
    {
        icon: BarChart3,
        title: 'Punto de Venta',
        description: 'POS completo con inventario, caja, múltiples métodos de pago y reportes de ventas.',
        gradient: 'from-slate-100 to-slate-50',
    },
    {
        icon: Shield,
        title: 'Multi-Empresa',
        description: 'Datos completamente aislados por empresa. Perfecto para franquicias y múltiples sucursales.',
        gradient: 'from-slate-100 to-slate-50',
    },
    {
        icon: Smartphone,
        title: 'Funciona Offline',
        description: 'Continúa trabajando sin internet. Los datos se sincronizan automáticamente al reconectar.',
        gradient: 'from-slate-100 to-slate-50',
    },
    {
        icon: Users,
        title: 'Portal de Clientes',
        description: 'Tus clientes pueden ver el estado de sus reparaciones, historial y pagos pendientes.',
        gradient: 'from-slate-100 to-slate-50',
    },
]

const brands = [
    { name: 'Bosch', color: '#ED1C24' },
    { name: 'DeWalt', color: '#FEBD17' },
    { name: 'Makita', color: '#00A3E0' },
    { name: 'Milwaukee', color: '#DB0032' },
    { name: 'Stanley', color: '#FFD100' },
    { name: 'Black+Decker', color: '#FF6600' },
    { name: 'Hitachi', color: '#E60012' },
    { name: 'Total', color: '#FF0000' },
    { name: 'Ingco', color: '#00529B' },
    { name: 'Emtop', color: '#0066B3' },
]

const duplicatedBrands = [...brands, ...brands]

const testimonials = [
    {
        name: 'Carlos Mendoza',
        role: 'Gerente, TecniHerramientas EC',
        content: 'RepairApp transformó nuestro taller. Ahora procesamos el doble de órdenes con menos errores. La automatización nos ha permitido enfocarnos en lo que realmente importa.',
        rating: 5,
        initials: 'CM',
    },
    {
        name: 'María Fernández',
        role: 'Propietaria, ServiFix',
        content: 'La integración con el SRI nos ahorra horas de trabajo. La facturación es automática y sin complicaciones. El mejor sistema que hemos usado.',
        rating: 5,
        initials: 'MF',
    },
    {
        name: 'Roberto Sánchez',
        role: 'Director, ToolService Pro',
        content: 'El portal de clientes ha mejorado enormemente nuestra comunicación. Los clientes están más satisfechos y recibimos menos llamadas preguntando por el estado.',
        rating: 5,
        initials: 'RS',
    },
]

const pricingPlans = [
    {
        name: 'Básico',
        price: 29,
        description: 'Perfecto para talleres pequeños que están comenzando',
        features: ['Hasta 2 usuarios', 'Órdenes ilimitadas', 'Facturación SRI', 'Soporte por email', 'Reportes básicos'],
        cta: 'Comenzar Gratis',
        popular: false,
    },
    {
        name: 'Profesional',
        price: 59,
        description: 'Para talleres en crecimiento que necesitan más poder',
        features: ['Hasta 10 usuarios', 'Todo del plan Básico', 'Portal de clientes', 'Reportes avanzados', 'Soporte prioritario', 'Integraciones'],
        cta: 'Comenzar Gratis',
        popular: true,
    },
    {
        name: 'Enterprise',
        price: 149,
        description: 'Para grandes operaciones con necesidades específicas',
        features: ['Usuarios ilimitados', 'Todo del plan Profesional', 'API acceso', 'Multi-sucursal', 'Gerente de cuenta', 'SLA garantizado'],
        cta: 'Contactar Ventas',
        popular: false,
    },
]

const stats = [
    { value: '500+', label: 'Talleres activos' },
    { value: '50K+', label: 'Órdenes procesadas' },
    { value: '99.9%', label: 'Uptime garantizado' },
    { value: '24/7', label: 'Soporte técnico' },
]

// Brand Carousel Component
function BrandCarousel() {
    return (
        <div className="relative overflow-hidden py-6">
            <div
                className="absolute left-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to right, rgba(250,251,252,1) 0%, rgba(250,251,252,0.8) 50%, transparent 100%)' }}
            />
            <div
                className="absolute right-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to left, rgba(250,251,252,1) 0%, rgba(250,251,252,0.8) 50%, transparent 100%)' }}
            />

            <div className="flex animate-scroll">
                {duplicatedBrands.map((brand, index) => (
                    <div
                        key={`${brand.name}-${index}`}
                        className="flex-shrink-0 mx-10 flex items-center justify-center"
                    >
                        <div className="group relative px-6 py-3 rounded-xl transition-all duration-300 hover:bg-slate-50 hover:shadow-md cursor-default">
                            <span
                                className="text-2xl font-bold tracking-tight transition-all duration-300 text-slate-300 group-hover:text-slate-700"
                            >
                                {brand.name}
                            </span>
                            <div
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-10"
                                style={{ backgroundColor: brand.color }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Animated Section wrapper
function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Premium Background Component - Unique layered effect
function PremiumBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#fafbfc] via-white to-[#f8fafc]" />

            {/* Mesh gradient blobs */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(241,245,249,0.8) 0%, rgba(241,245,249,0.4) 50%, transparent 70%)' }}
                />
                <div
                    className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(226,232,240,0.6) 0%, rgba(241,245,249,0.3) 50%, transparent 70%)' }}
                />
                <div
                    className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(241,245,249,0.7) 0%, rgba(248,250,252,0.4) 50%, transparent 70%)' }}
                />
            </div>

            {/* Animated floating orbs */}
            <motion.div
                className="absolute top-[15%] left-[10%] w-[300px] h-[300px] rounded-full blur-2xl"
                style={{ background: 'linear-gradient(to bottom right, rgba(226,232,240,0.3), transparent)' }}
                animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.05, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-[40%] right-[15%] w-[400px] h-[400px] rounded-full blur-2xl"
                style={{ background: 'linear-gradient(to bottom left, rgba(226,232,240,0.25), transparent)' }}
                animate={{
                    x: [0, -25, 0],
                    y: [0, 25, 0],
                    scale: [1, 1.08, 1],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[20%] left-[30%] w-[350px] h-[350px] rounded-full blur-2xl"
                style={{ background: 'linear-gradient(to top right, rgba(226,232,240,0.2), transparent)' }}
                animate={{
                    x: [0, 20, 0],
                    y: [0, 15, 0],
                    scale: [1, 1.03, 1],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Dot pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage: `radial-gradient(circle at center, #94a3b8 0.5px, transparent 0.5px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Subtle grid lines */}
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                }}
            />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Subtle vignette */}
            <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(248,250,252,0.4) 60%, rgba(241,245,249,0.7) 100%)' }}
            />
        </div>
    )
}

export default function LandingPage() {
    const router = useRouter()
    const [scrolled, setScrolled] = useState(false)
    const [trackingCode, setTrackingCode] = useState('')

    const handleTrackingSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (trackingCode.trim()) {
            router.push(`/tracking?numero=${encodeURIComponent(trackingCode.trim())}`)
        }
    }

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="min-h-screen text-slate-900 overflow-x-hidden relative">
            {/* Premium Background */}
            <PremiumBackground />

            {/* Custom animation styles */}
            <style jsx global>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 35s linear infinite;
                }
                .animate-scroll:hover {
                    animation-play-state: paused;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-shimmer {
                    animation: shimmer 8s linear infinite;
                }
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.6; }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 4s ease-in-out infinite;
                }
            `}</style>

            {/* Navigation - Premium Glass Effect */}
            <motion.nav
                className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
                    ? 'bg-white/80 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.05)]'
                    : 'bg-transparent'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <motion.div
                            className="flex items-center gap-2.5"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                                <Wrench className="w-5 h-5 text-white" strokeWidth={1.5} />
                            </div>
                            <span className="font-bold text-xl text-slate-900 tracking-tight">RepairApp</span>
                        </motion.div>
                        <div className="hidden md:flex items-center gap-8">
                            {['Características', 'Precios', 'Testimonios'].map((item) => (
                                <Link
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
                                >
                                    {item}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 rounded-full transition-all duration-300 group-hover:w-full" />
                                </Link>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
                                    Iniciar sesión
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25 transition-all">
                                    Prueba Gratis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section - Premium & Dynamic */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden">
                {/* Hero-specific gradient accent */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-slate-100/50 via-slate-50/30 to-transparent rounded-full blur-3xl" />

                {/* Decorative lines */}
                <div className="absolute top-40 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent" />
                <div className="absolute top-60 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/30 to-transparent" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium mb-8 shadow-lg shadow-slate-900/20"
                    >
                        <Sparkles className="w-4 h-4" />
                        Nuevo: Portal de Clientes con QR
                        <ArrowRight className="w-4 h-4" />
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                    >
                        El sistema completo para
                        <motion.span
                            className="block mt-2 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                        >
                            Servicios Técnicos
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        className="mt-8 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        Gestiona órdenes de servicio, facturación electrónica SRI, inventario, POS y más.
                        Todo en una plataforma diseñada para Ecuador.
                    </motion.p>

                    <motion.div
                        className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <Link href="/register">
                            <Button size="lg" className="h-14 px-8 text-base bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                Comenzar Gratis
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/tracking">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-slate-300 text-slate-700 hover:bg-white/80 gap-2 hover:border-slate-400 transition-all backdrop-blur-sm">
                                <Play className="w-5 h-5" />
                                Ver Demo
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Quick Tracking Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="mt-12 max-w-md mx-auto"
                    >
                        <form onSubmit={handleTrackingSearch} className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-100 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                            <div className="relative bg-white p-1.5 rounded-2xl shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 flex items-center gap-2">
                                <div className="pl-4 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-slate-400" />
                                </div>
                                <Input
                                    placeholder="Rastrea tu orden (ej: ORD-001)"
                                    className="border-0 bg-transparent focus-visible:ring-0 text-base h-12 px-2 shadow-none placeholder:text-slate-400"
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    disabled={!trackingCode.trim()}
                                    className="h-11 px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    Rastrear
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                                Consulta el estado de tu reparación en tiempo real
                            </p>
                        </form>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.8 }}
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                className="text-center p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-100/50 shadow-sm"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.8)' }}
                            >
                                <div className="text-3xl md:text-4xl font-bold text-slate-900">{stat.value}</div>
                                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Brands Carousel */}
                    <div className="mt-20">
                        <motion.p
                            className="text-sm text-slate-500 mb-6 font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                        >
                            Usado por servicios técnicos autorizados de marcas líderes
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.3 }}
                        >
                            <BrandCarousel />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section - Premium Cards */}
            <section id="características" className="py-32 px-4 bg-white relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50/50 via-transparent to-transparent" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <AnimatedSection className="text-center mb-20">
                        <motion.p variants={fadeInUp} className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                            Características
                        </motion.p>
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                            Todo lo que necesitas
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
                            Una plataforma completa para gestionar tu servicio técnico de principio a fin
                        </motion.p>
                    </AnimatedSection>

                    <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <motion.div
                                    key={feature.title}
                                    variants={fadeInUp}
                                >
                                    <Card className="group relative border-0 bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                                        <CardContent className="p-8">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 shadow-lg shadow-slate-900/20 group-hover:scale-110 transition-transform duration-300">
                                                <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-3 text-slate-900">{feature.title}</h3>
                                            <p className="text-slate-600 leading-relaxed">
                                                {feature.description}
                                            </p>
                                            <div className="mt-6 flex items-center text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                                                Saber más
                                                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </CardContent>
                                        {/* Subtle gradient overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-100/0 group-hover:from-slate-50/50 group-hover:to-slate-100/30 transition-all duration-500 pointer-events-none" />
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </AnimatedSection>
                </div>
            </section>

            {/* Pricing Section - Clean & Premium */}
            <section id="precios" className="py-32 px-4 bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <AnimatedSection className="text-center mb-20">
                        <motion.p variants={fadeInUp} className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                            Precios
                        </motion.p>
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                            Planes simples y transparentes
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="mt-6 text-xl text-slate-600">
                            Comienza gratis por 14 días. Sin tarjeta de crédito requerida.
                        </motion.p>
                    </AnimatedSection>

                    <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                variants={scaleIn}
                                className="relative"
                            >
                                <Card className={`relative h-full bg-white border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden ${plan.popular ? 'ring-2 ring-slate-900 scale-105 z-10' : ''
                                    }`}>
                                    {plan.popular && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900" />
                                    )}
                                    <CardContent className="p-8">
                                        {plan.popular && (
                                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-full mb-4">
                                                <Sparkles className="w-3 h-3" />
                                                Más Popular
                                            </div>
                                        )}
                                        <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                                        <p className="text-slate-500 text-sm mt-2 min-h-[2.5rem]">{plan.description}</p>
                                        <div className="mt-6 flex items-baseline gap-1">
                                            <span className="text-5xl font-bold text-slate-900">${plan.price}</span>
                                            <span className="text-slate-500">/mes</span>
                                        </div>
                                        <ul className="mt-8 space-y-4">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-3 text-slate-600">
                                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-slate-700" strokeWidth={2.5} />
                                                    </div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            className={`w-full mt-8 h-12 text-base font-medium transition-all ${plan.popular
                                                ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                                                }`}
                                        >
                                            {plan.cta}
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatedSection>

                    <motion.p
                        className="text-center mt-12 text-slate-500"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        Todos los planes incluyen soporte técnico y actualizaciones gratuitas
                    </motion.p>
                </div>
            </section>

            {/* Testimonials - Premium Cards */}
            <section id="testimonios" className="py-32 px-4 bg-white relative">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection className="text-center mb-20">
                        <motion.p variants={fadeInUp} className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                            Testimonios
                        </motion.p>
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                            Lo que dicen nuestros clientes
                        </motion.h2>
                    </AnimatedSection>

                    <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={testimonial.name}
                                variants={fadeInUp}
                            >
                                <Card className="h-full border-0 bg-gradient-to-br from-slate-50 to-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
                                    <CardContent className="p-8">
                                        <div className="flex gap-1 mb-6">
                                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                                                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                        <p className="text-slate-700 leading-relaxed text-lg">
                                            &ldquo;{testimonial.content}&rdquo;
                                        </p>
                                        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                                            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-sm font-semibold text-white shadow-lg">
                                                {testimonial.initials}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{testimonial.name}</p>
                                                <p className="text-sm text-slate-500">{testimonial.role}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatedSection>
                </div>
            </section>

            {/* CTA Section - Bold & Premium */}
            <section className="py-32 px-4 bg-slate-900 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-slate-800 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-800 rounded-full blur-3xl opacity-50" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <AnimatedSection>
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Comienza a transformar tu negocio hoy
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-slate-400 mb-10 max-w-xl mx-auto text-xl leading-relaxed">
                            Prueba RepairApp gratis por 14 días. Sin tarjeta de crédito, sin compromisos.
                        </motion.p>
                        <motion.div variants={fadeInUp}>
                            <Link href="/register">
                                <Button size="lg" className="h-14 px-10 text-lg bg-white text-slate-900 hover:bg-slate-100 gap-2 shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    Crear Cuenta Gratis
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </Link>
                        </motion.div>
                        <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-slate-400">
                            {['14 días gratis', 'Sin tarjeta requerida', 'Soporte incluido', 'Cancela cuando quieras'].map((item) => (
                                <span key={item} className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-slate-500" />
                                    {item}
                                </span>
                            ))}
                        </motion.div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Footer - Clean & Professional */}
            <footer className="bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2.5 mb-6">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                                    <Wrench className="w-5 h-5 text-white" strokeWidth={1.5} />
                                </div>
                                <span className="font-bold text-xl text-slate-900">RepairApp</span>
                            </div>
                            <p className="text-slate-600 max-w-sm leading-relaxed">
                                Sistema integral de gestión para servicios técnicos.
                                Facturación electrónica SRI Ecuador, órdenes de servicio,
                                inventario y punto de venta.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4">Producto</h4>
                            <ul className="space-y-3 text-sm">
                                <li><Link href="#características" className="text-slate-600 hover:text-slate-900 transition-colors">Características</Link></li>
                                <li><Link href="#precios" className="text-slate-600 hover:text-slate-900 transition-colors">Precios</Link></li>
                                <li><Link href="/tracking" className="text-slate-600 hover:text-slate-900 transition-colors">Tracking</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4">Contacto</h4>
                            <ul className="space-y-3 text-sm">
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

                    <div className="border-t border-slate-100 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500">
                            © {new Date().getFullYear()} RepairApp. Todos los derechos reservados.
                        </p>
                        <div className="flex gap-6 text-sm text-slate-500">
                            <Link href="/terminos" className="hover:text-slate-900 transition-colors">Términos</Link>
                            <Link href="/privacidad" className="hover:text-slate-900 transition-colors">Privacidad</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
