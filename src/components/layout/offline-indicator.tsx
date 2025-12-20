// src/components/layout/offline-indicator.tsx
// Shows connection status and pending sync items

'use client';

import { useOffline } from '@/hooks/use-offline';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CloudOff, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineIndicator() {
    const { isOnline, isSyncing, pendingCount, sync } = useOffline();

    // Don't show anything if online and nothing pending
    if (isOnline && pendingCount === 0 && !isSyncing) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-4 left-4 z-50"
            >
                {!isOnline ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full backdrop-blur-lg">
                        <WifiOff className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-400">
                            Sin conexión
                        </span>
                        {pendingCount > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-amber-500/30 rounded-full text-xs text-amber-300">
                                {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                ) : pendingCount > 0 ? (
                    <button
                        onClick={sync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full backdrop-blur-lg hover:bg-blue-500/30 transition-colors cursor-pointer"
                    >
                        {isSyncing ? (
                            <>
                                <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                                <span className="text-sm font-medium text-blue-400">
                                    Sincronizando...
                                </span>
                            </>
                        ) : (
                            <>
                                <CloudOff className="h-4 w-4 text-blue-400" />
                                <span className="text-sm font-medium text-blue-400">
                                    {pendingCount} sin sincronizar
                                </span>
                            </>
                        )}
                    </button>
                ) : isSyncing ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-lg">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">
                            Sincronizado
                        </span>
                    </div>
                ) : null}
            </motion.div>
        </AnimatePresence>
    );
}
