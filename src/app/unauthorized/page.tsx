'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <Card className="bg-white/5 border-white/10 backdrop-blur">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-2xl flex items-center justify-center">
                            <ShieldX className="w-8 h-8 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Acceso Denegado
                        </h1>
                        <p className="text-slate-400 mb-6">
                            No tienes permisos para acceder a esta sección. Contacta a tu administrador si crees que esto es un error.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link href="/dashboard">
                                <Button variant="outline" className="gap-2 border-white/10 text-white hover:bg-white/10">
                                    <Home className="w-4 h-4" />
                                    Ir al Dashboard
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
