// src/app/offline/page.tsx
// Offline fallback page

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    WifiOff,
    RefreshCw,
    Cloud,
    Database,
    CheckCircle,
    ArrowRight,
} from 'lucide-react';

export default function OfflinePage() {
    const [isOnline, setIsOnline] = useState(false);
    const [pendingItems, setPendingItems] = useState(0);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check pending items
        const checkPending = async () => {
            try {
                const { offlineDB } = await import('@/lib/offline');
                const items = await offlineDB.getPendingSyncItems();
                setPendingItems(items.length);
            } catch (error) {
                console.error('Error checking pending items:', error);
            }
        };
        checkPending();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    if (isOnline) {
        return (
            <div className="min-h-screen bg-[hsl(var(--surface-base))] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">
                        ¡Conexión Restaurada!
                    </h1>
                    <p className="text-[hsl(var(--text-muted))] mb-6">
                        Ya puedes volver a usar la aplicación
                    </p>
                    <Button
                        onClick={() => window.location.href = '/'}
                        className="gap-2 bg-[hsl(var(--brand-accent))]"
                    >
                        Continuar
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--surface-base))] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <Card className="card-linear">
                    <CardContent className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <WifiOff className="h-10 w-10 text-amber-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">
                            Sin Conexión
                        </h1>
                        <p className="text-[hsl(var(--text-muted))] mb-6">
                            No hay conexión a internet. Algunas funciones pueden estar limitadas.
                        </p>

                        {/* Offline capabilities */}
                        <div className="bg-[hsl(var(--surface-highlight))] rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm font-medium text-[hsl(var(--text-primary))] mb-3">
                                Disponible sin conexión:
                            </p>
                            <ul className="space-y-2 text-sm text-[hsl(var(--text-secondary))]">
                                <li className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-blue-400" />
                                    Ver productos en caché
                                </li>
                                <li className="flex items-center gap-2">
                                    <Cloud className="h-4 w-4 text-violet-400" />
                                    Crear ventas (se sincronizarán después)
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    Ver órdenes recientes
                                </li>
                            </ul>
                        </div>

                        {/* Pending sync */}
                        {pendingItems > 0 && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
                                <p className="text-sm text-blue-400">
                                    {pendingItems} elemento(s) pendiente(s) de sincronizar
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={handleRetry}
                            variant="outline"
                            className="w-full gap-2 border-[hsl(var(--border-subtle))]"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reintentar Conexión
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
