// src/app/pricing/page.tsx
// Public pricing page with plan selection

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Wrench,
    CheckCircle,
    ChevronRight,
    ArrowLeft,
    Sparkles,
    Zap,
    Building2,
    Users,
    FileText,
    Shield,
    HeadphonesIcon,
} from 'lucide-react'

interface Plan {
    id: string
    nombre: string
    tipo: string
    descripcion: string
    precio_mensual: number
    precio_anual: number
    max_usuarios: number | null
    max_ordenes_mes: number | null
    portal_clientes: boolean
    reportes_avanzados: boolean
    api_acceso: boolean
    multi_sucursal: boolean
    soporte_prioritario: boolean
}

const planIcons: Record<string, any> = {
    basico: Zap,
    profesional: Building2,
    enterprise: Shield,
}

const planGradients: Record<string, string> = {
    basico: 'from-blue-500 to-cyan-500',
    profesional: 'from-purple-500 to-pink-500',
    enterprise: 'from-amber-500 to-orange-500',
}

export default function PricingPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [isAnnual, setIsAnnual] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const { data, error } = await supabase
                    .from('planes')
                    .select('*')
                    .eq('activo', true)
                    .order('orden')

                if (error) throw error
                setPlans(data || [])
            } catch (error) {
                console.error('Error loading plans:', error)
                // Fallback plans if DB not configured
                setPlans([
                    {
                        id: '1', nombre: 'Básico', tipo: 'basico', descripcion: 'Perfecto para talleres pequeños',
                        precio_mensual: 29, precio_anual: 290, max_usuarios: 2, max_ordenes_mes: 100,
                        portal_clientes: false, reportes_avanzados: false, api_acceso: false, multi_sucursal: false, soporte_prioritario: false
                    },
                    {
                        id: '2', nombre: 'Profesional', tipo: 'profesional', descripcion: 'Para talleres en crecimiento',
                        precio_mensual: 59, precio_anual: 590, max_usuarios: 10, max_ordenes_mes: null,
                        portal_clientes: true, reportes_avanzados: true, api_acceso: false, multi_sucursal: false, soporte_prioritario: true
                    },
                    {
                        id: '3', nombre: 'Enterprise', tipo: 'enterprise', descripcion: 'Para grandes operaciones',
                        precio_mensual: 149, precio_anual: 1490, max_usuarios: null, max_ordenes_mes: null,
                        portal_clientes: true, reportes_avanzados: true, api_acceso: true, multi_sucursal: true, soporte_prioritario: true
                    },
                ])
            } finally {
                setIsLoading(false)
            }
        }

        loadPlans()
    }, [supabase])

    const handleSelectPlan = (planId: string) => {
        router.push(`/register?plan=${planId}&billing=${isAnnual ? 'annual' : 'monthly'}`)
    }

    const getFeatures = (plan: Plan) => {
        const features = [
            {
                included: true,
                text: plan.max_usuarios ? `Hasta ${plan.max_usuarios} usuarios` : 'Usuarios ilimitados'
            },
            {
                included: true,
                text: plan.max_ordenes_mes ? `${plan.max_ordenes_mes} órdenes/mes` : 'Órdenes ilimitadas'
            },
            { included: true, text: 'Facturación SRI' },
            { included: true, text: 'Inventario y POS' },
            { included: plan.portal_clientes, text: 'Portal de clientes' },
            { included: plan.reportes_avanzados, text: 'Reportes avanzados' },
            { included: plan.api_acceso, text: 'Acceso API' },
            { included: plan.multi_sucursal, text: 'Multi-sucursal' },
            { included: plan.soporte_prioritario, text: 'Soporte prioritario' },
        ]
        return features
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
            </div>

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">RepairApp</span>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" className="text-slate-400 hover:text-white gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <section className="relative py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Badge className="mb-6 bg-purple-500/20 text-purple-400 border-purple-500/30 py-1.5 px-4">
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            14 días de prueba gratis
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Elige tu plan
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Todos los planes incluyen acceso completo durante el período de prueba.
                            Cancela cuando quieras.
                        </p>

                        {/* Billing Toggle */}
                        <div className="mt-10 flex items-center justify-center gap-4">
                            <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>
                                Mensual
                            </span>
                            <Switch
                                checked={isAnnual}
                                onCheckedChange={setIsAnnual}
                                className="data-[state=checked]:bg-purple-500"
                            />
                            <span className={`text-sm ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
                                Anual
                                <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-0">
                                    2 meses gratis
                                </Badge>
                            </span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Plans */}
            <section className="relative pb-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan, index) => {
                            const Icon = planIcons[plan.tipo] || Zap
                            const gradient = planGradients[plan.tipo] || 'from-blue-500 to-cyan-500'
                            const isProfessional = plan.tipo === 'profesional'
                            const price = isAnnual ? plan.precio_anual / 12 : plan.precio_mensual

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className={`relative bg-white/5 border-white/10 backdrop-blur h-full ${isProfessional ? 'ring-2 ring-purple-500 scale-105' : ''}`}>
                                        {isProfessional && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-white">
                                                    Más Popular
                                                </Badge>
                                            </div>
                                        )}
                                        <CardContent className="p-6 flex flex-col h-full">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>

                                            <h3 className="text-2xl font-bold text-white">{plan.nombre}</h3>
                                            <p className="text-slate-400 text-sm mt-1">{plan.descripcion}</p>

                                            <div className="mt-6">
                                                <span className="text-4xl font-bold text-white">
                                                    ${price.toFixed(0)}
                                                </span>
                                                <span className="text-slate-400">/mes</span>
                                                {isAnnual && (
                                                    <p className="text-xs text-emerald-400 mt-1">
                                                        Facturado ${plan.precio_anual}/año
                                                    </p>
                                                )}
                                            </div>

                                            <ul className="mt-6 space-y-3 flex-1">
                                                {getFeatures(plan).map((feature, i) => (
                                                    <li
                                                        key={i}
                                                        className={`flex items-center gap-2 text-sm ${feature.included ? 'text-slate-300' : 'text-slate-600'}`}
                                                    >
                                                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${feature.included ? 'text-emerald-400' : 'text-slate-700'}`} />
                                                        {feature.text}
                                                    </li>
                                                ))}
                                            </ul>

                                            <Button
                                                onClick={() => handleSelectPlan(plan.id)}
                                                className={`w-full mt-6 ${isProfessional
                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                                    : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                            >
                                                {plan.tipo === 'enterprise' ? 'Contactar' : 'Comenzar Prueba'}
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* FAQ / Trust Items */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                            <Shield className="w-8 h-8 text-emerald-400" />
                            <div>
                                <p className="font-medium text-white">Datos Seguros</p>
                                <p className="text-sm text-slate-400">Encriptación end-to-end</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                            <HeadphonesIcon className="w-8 h-8 text-blue-400" />
                            <div>
                                <p className="font-medium text-white">Soporte Incluido</p>
                                <p className="text-sm text-slate-400">Ayuda cuando la necesites</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                            <FileText className="w-8 h-8 text-purple-400" />
                            <div>
                                <p className="font-medium text-white">Cancela cuando quieras</p>
                                <p className="text-sm text-slate-400">Sin compromisos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 px-4 bg-black/20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold">RepairApp</span>
                    </div>
                    <p className="text-sm text-slate-500">
                        © 2024 RepairApp. Todos los precios en USD.
                    </p>
                </div>
            </footer>
        </div>
    )
}
