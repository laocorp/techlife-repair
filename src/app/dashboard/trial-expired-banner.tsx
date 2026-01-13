'use client'

import { AlertTriangle, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui'

interface TrialExpiredBannerProps {
    type: 'expired' | 'suspended'
}

export function TrialExpiredBanner({ type }: TrialExpiredBannerProps) {
    const isSuspended = type === 'suspended'

    return (
        <div className={`${isSuspended ? 'bg-error' : 'bg-warning'} text-white`}>
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {isSuspended ? (
                            <Lock className="h-6 w-6 flex-shrink-0" />
                        ) : (
                            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                        )}
                        <div>
                            <p className="font-semibold">
                                {isSuspended
                                    ? 'Cuenta suspendida'
                                    : 'Tu período de prueba ha expirado'}
                            </p>
                            <p className="text-sm opacity-90">
                                {isSuspended
                                    ? 'Contacta a soporte para más información.'
                                    : 'Actualiza tu plan para continuar usando todas las funciones.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isSuspended && (
                            <Button
                                className="bg-white text-warning hover:bg-white/90"
                                onClick={() => window.location.href = '/dashboard/settings/billing'}
                            >
                                Actualizar Plan
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="border-white/50 text-white hover:bg-white/10"
                            onClick={() => window.location.href = 'mailto:soporte@techrepair.com'}
                        >
                            <Mail className="h-4 w-4" />
                            Contactar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
