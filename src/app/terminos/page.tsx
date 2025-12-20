// src/app/terminos/page.tsx
// Terms of service page (public)

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TerminosPage() {
    return (
        <div className="min-h-screen bg-[hsl(var(--surface-base))] py-12">
            <div className="max-w-3xl mx-auto px-4">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-6 text-[hsl(var(--text-muted))]">
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                </Link>

                <Card className="card-linear">
                    <CardContent className="p-8 prose prose-invert max-w-none">
                        <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-6">
                            Términos y Condiciones de Servicio
                        </h1>

                        <p className="text-[hsl(var(--text-muted))] mb-4">
                            Última actualización: Diciembre 2024
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            1. Aceptación de Términos
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Al acceder y utilizar RepairApp, usted acepta estar sujeto a estos términos y condiciones de servicio. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            2. Descripción del Servicio
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            RepairApp es una plataforma de gestión para servicios técnicos que incluye gestión de órdenes de servicio, inventario, facturación electrónica y más.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            3. Cuentas de Usuario
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Usted es responsable de mantener la confidencialidad de su cuenta y contraseña. Acepta notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            4. Uso Aceptable
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Usted acepta no usar el servicio para ningún propósito ilegal o no autorizado. No debe violar ninguna ley en su jurisdicción, incluyendo leyes de propiedad intelectual.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            5. Facturación Electrónica
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            El servicio de facturación electrónica cumple con las regulaciones del SRI de Ecuador. Usted es responsable de mantener actualizados sus certificados de firma electrónica.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            6. Limitación de Responsabilidad
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            RepairApp no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos resultantes de su uso del servicio.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            7. Contacto
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Para preguntas sobre estos términos, contáctenos en: legal@repairapp.ec
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
