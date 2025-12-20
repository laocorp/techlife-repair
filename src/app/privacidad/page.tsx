// src/app/privacidad/page.tsx
// Privacy policy page (public)

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrivacidadPage() {
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
                            Política de Privacidad
                        </h1>

                        <p className="text-[hsl(var(--text-muted))] mb-4">
                            Última actualización: Diciembre 2024
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            1. Información que Recopilamos
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Recopilamos información que usted nos proporciona directamente, como nombre, email, información de la empresa y datos de facturación.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            2. Uso de la Información
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Utilizamos la información para proporcionar y mejorar nuestros servicios, procesar transacciones, enviar comunicaciones y cumplir con obligaciones legales.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            3. Almacenamiento de Datos
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Sus datos se almacenan de forma segura utilizando encriptación y se mantienen en servidores protegidos. Implementamos medidas de seguridad técnicas y organizativas.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            4. Compartir Información
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            No vendemos ni compartimos su información personal con terceros, excepto cuando sea necesario para proporcionar el servicio o cumplir con la ley.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            5. Derechos del Usuario
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Usted tiene derecho a acceder, rectificar, eliminar y portar sus datos personales. Puede ejercer estos derechos contactándonos.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            6. Cookies
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Utilizamos cookies esenciales para el funcionamiento del servicio y cookies analíticas para mejorar la experiencia del usuario.
                        </p>

                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] mt-6 mb-3">
                            7. Contacto
                        </h2>
                        <p className="text-[hsl(var(--text-secondary))] mb-4">
                            Para preguntas sobre privacidad, contáctenos en: privacidad@repairapp.ec
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
