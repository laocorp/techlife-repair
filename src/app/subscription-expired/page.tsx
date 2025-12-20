'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, AlertTriangle, Mail, Phone } from 'lucide-react'

export default function SubscriptionExpiredPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg w-full"
            >
                <Card className="bg-white/5 border-white/10 backdrop-blur overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Suscripción Vencida
                        </h1>
                        <p className="text-slate-400 mb-6">
                            Tu suscripción a RepairApp ha expirado. Renueva tu plan para continuar usando todas las funciones del sistema.
                        </p>

                        <div className="bg-white/5 rounded-xl p-4 mb-6">
                            <p className="text-sm text-slate-400 mb-3">Tus datos están seguros</p>
                            <ul className="text-sm text-slate-300 space-y-2 text-left">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                    Todos tus datos se mantienen guardados
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                    Podrás acceder inmediatamente al renovar
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                    Sin pérdida de historial ni configuraciones
                                </li>
                            </ul>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2 mb-4">
                            <CreditCard className="w-4 h-4" />
                            Renovar Suscripción
                        </Button>

                        <div className="text-sm text-slate-500">
                            <p className="mb-2">¿Necesitas ayuda?</p>
                            <div className="flex justify-center gap-4">
                                <a href="mailto:soporte@repairapp.ec" className="flex items-center gap-1 text-blue-400 hover:underline">
                                    <Mail className="w-3 h-3" /> soporte@repairapp.ec
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
