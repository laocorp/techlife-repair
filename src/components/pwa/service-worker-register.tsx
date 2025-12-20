// src/components/pwa/service-worker-register.tsx
// Registers service worker and handles updates

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

export function ServiceWorkerRegister() {
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
    const [showReload, setShowReload] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            registerServiceWorker();
        }
    }, []);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            console.log('Service Worker registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        setWaitingWorker(newWorker);
                        setShowReload(true);
                        toast.info('Nueva versión disponible', {
                            description: 'Recarga para actualizar la aplicación',
                            duration: 10000,
                            action: {
                                label: 'Actualizar',
                                onClick: () => reloadPage(),
                            },
                        });
                    }
                });
            });

            // Handle controller change (after skipWaiting)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });

        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    };

    const reloadPage = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        setShowReload(false);
    };

    // Show update prompt
    if (showReload) {
        return (
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border-subtle))] rounded-lg shadow-xl">
                <Download className="h-5 w-5 text-[hsl(var(--brand-accent))]" />
                <div className="mr-2">
                    <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                        Nueva versión disponible
                    </p>
                    <p className="text-xs text-[hsl(var(--text-muted))]">
                        Recarga para aplicar cambios
                    </p>
                </div>
                <Button size="sm" onClick={reloadPage} className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Actualizar
                </Button>
            </div>
        );
    }

    return null;
}
