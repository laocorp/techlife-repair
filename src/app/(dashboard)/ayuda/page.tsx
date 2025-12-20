// src/app/(dashboard)/ayuda/page.tsx
// Help and support page

'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    HelpCircle,
    BookOpen,
    MessageCircle,
    Video,
    Mail,
    Phone,
    ChevronRight,
    Search,
    ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

const faqs = [
    {
        question: '¿Cómo crear una orden de servicio?',
        answer: 'Ve a Órdenes > Nueva Orden y completa los datos del cliente y equipo.',
    },
    {
        question: '¿Cómo configurar la facturación electrónica?',
        answer: 'En Configuración > Facturación puedes agregar tus datos del SRI.',
    },
    {
        question: '¿Cómo agregar un nuevo usuario?',
        answer: 'Solo administradores pueden agregar usuarios desde Configuración > Usuarios.',
    },
    {
        question: '¿Cómo funciona el portal de clientes?',
        answer: 'Los clientes pueden ver sus equipos en reparación usando el código QR de su orden.',
    },
]

const resources = [
    { icon: BookOpen, title: 'Documentación', description: 'Guías completas de uso', href: '#' },
    { icon: Video, title: 'Video Tutoriales', description: 'Aprende de forma visual', href: '#' },
    { icon: MessageCircle, title: 'Chat de Soporte', description: 'Ayuda en tiempo real', href: '#' },
]

export default function AyudaPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                    Centro de Ayuda
                </h1>
                <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Encuentra respuestas y contacta con soporte
                </p>
            </div>

            {/* Search */}
            <Card className="card-linear">
                <CardContent className="p-6">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-muted))]" />
                        <Input
                            placeholder="Buscar en la ayuda..."
                            className="pl-10 h-12 input-linear text-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Resources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resources.map((resource, index) => {
                    const Icon = resource.icon
                    return (
                        <Card key={index} className="card-linear hover:border-[hsl(var(--brand-accent))]/50 transition-colors cursor-pointer">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10">
                                        <Icon className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[hsl(var(--text-primary))]">{resource.title}</p>
                                        <p className="text-sm text-[hsl(var(--text-muted))] mt-1">{resource.description}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-[hsl(var(--text-muted))]" />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* FAQs */}
            <Card className="card-linear">
                <CardHeader>
                    <CardTitle className="text-lg text-[hsl(var(--text-primary))] flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Preguntas Frecuentes
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-[hsl(var(--border-subtle))]">
                        {faqs.map((faq, index) => (
                            <div key={index} className="p-4 hover:bg-[hsl(var(--interactive-hover))] transition-colors">
                                <p className="font-medium text-[hsl(var(--text-primary))]">{faq.question}</p>
                                <p className="text-sm text-[hsl(var(--text-muted))] mt-1">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Contact */}
            <Card className="card-linear">
                <CardHeader>
                    <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                        Contactar Soporte
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-4 bg-[hsl(var(--surface-highlight))] rounded-lg">
                            <Mail className="h-5 w-5 text-[hsl(var(--text-muted))]" />
                            <div>
                                <p className="font-medium text-[hsl(var(--text-primary))]">Email</p>
                                <p className="text-sm text-[hsl(var(--text-muted))]">soporte@repairapp.ec</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-[hsl(var(--surface-highlight))] rounded-lg">
                            <Phone className="h-5 w-5 text-[hsl(var(--text-muted))]" />
                            <div>
                                <p className="font-medium text-[hsl(var(--text-primary))]">WhatsApp</p>
                                <p className="text-sm text-[hsl(var(--text-muted))]">+593 99 123 4567</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
