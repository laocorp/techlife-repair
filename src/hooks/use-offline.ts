// src/hooks/use-offline.ts
// Hook for offline status and sync

'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '@/lib/offline';

interface UseOfflineReturn {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    sync: () => Promise<void>;
    cacheData: (empresaId: string) => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        // Subscribe to changes
        const unsubscribe = syncManager.subscribe((online) => {
            setIsOnline(online);
        });

        // Update pending count
        const updatePending = async () => {
            const { offlineDB } = await import('@/lib/offline');
            const pending = await offlineDB.getPendingSyncItems();
            setPendingCount(pending.length);
        };
        updatePending();

        return () => unsubscribe();
    }, []);

    const sync = useCallback(async () => {
        setIsSyncing(true);
        try {
            await syncManager.sync();
            const { offlineDB } = await import('@/lib/offline');
            const pending = await offlineDB.getPendingSyncItems();
            setPendingCount(pending.length);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    const cacheData = useCallback(async (empresaId: string) => {
        await syncManager.cacheForOffline(empresaId);
    }, []);

    return {
        isOnline,
        isSyncing,
        pendingCount,
        sync,
        cacheData,
    };
}
