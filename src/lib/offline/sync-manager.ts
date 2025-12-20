// src/lib/offline/sync-manager.ts
// Manages background sync between IndexedDB and Supabase

import { createClient } from '@/lib/supabase/client';
import { offlineDB, SyncQueueItem } from './indexed-db';

const MAX_RETRIES = 3;

class SyncManager {
    private isOnline: boolean = true;
    private syncInProgress: boolean = false;
    private listeners: Set<(online: boolean) => void> = new Set();

    constructor() {
        if (typeof window !== 'undefined') {
            this.isOnline = navigator.onLine;

            window.addEventListener('online', () => {
                this.isOnline = true;
                this.notifyListeners();
                this.sync();
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
                this.notifyListeners();
            });
        }
    }

    // Check online status
    get online(): boolean {
        return this.isOnline;
    }

    // Subscribe to online/offline changes
    subscribe(callback: (online: boolean) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(): void {
        this.listeners.forEach((callback) => callback(this.isOnline));
    }

    // Main sync function
    async sync(): Promise<{ success: number; failed: number }> {
        if (!this.isOnline || this.syncInProgress) {
            return { success: 0, failed: 0 };
        }

        this.syncInProgress = true;
        let success = 0;
        let failed = 0;

        try {
            const pendingItems = await offlineDB.getPendingSyncItems();
            console.log(`[Sync] ${pendingItems.length} items pending`);

            for (const item of pendingItems) {
                try {
                    await this.syncItem(item);
                    await offlineDB.removeSyncItem(item.id);
                    success++;
                } catch (error) {
                    console.error(`[Sync] Failed to sync item ${item.id}:`, error);

                    if (item.retries >= MAX_RETRIES) {
                        // Move to failed items or notify user
                        console.error(`[Sync] Max retries reached for ${item.id}`);
                        await offlineDB.removeSyncItem(item.id);
                    } else {
                        await offlineDB.incrementRetry(item.id);
                    }
                    failed++;
                }
            }

            // Trigger service worker sync if available
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if ('sync' in registration) {
                    await (registration as any).sync.register('sync-pending-orders');
                }
            }

        } catch (error) {
            console.error('[Sync] Error during sync:', error);
        } finally {
            this.syncInProgress = false;
        }

        return { success, failed };
    }

    // Sync individual item
    private async syncItem(item: SyncQueueItem): Promise<void> {
        const supabase = createClient();

        switch (item.action) {
            case 'insert':
                const { error: insertError } = await supabase
                    .from(item.table)
                    .insert(item.data);
                if (insertError) throw insertError;
                break;

            case 'update':
                const { error: updateError } = await supabase
                    .from(item.table)
                    .update(item.data)
                    .eq('id', item.data.id);
                if (updateError) throw updateError;
                break;

            case 'delete':
                const { error: deleteError } = await supabase
                    .from(item.table)
                    .delete()
                    .eq('id', item.data.id);
                if (deleteError) throw deleteError;
                break;
        }
    }

    // Pre-cache data for offline use
    async cacheForOffline(empresaId: string): Promise<void> {
        const supabase = createClient();

        try {
            // Cache productos
            const { data: productos } = await supabase
                .from('productos')
                .select('id, codigo, nombre, precio_venta, stock, iva')
                .eq('empresa_id', empresaId)
                .eq('activo', true)
                .limit(500);

            if (productos) {
                await offlineDB.cacheProductos(productos);
                console.log(`[Cache] ${productos.length} productos cached`);
            }

            // Cache clientes
            const { data: clientes } = await supabase
                .from('clientes')
                .select('id, identificacion, nombre, telefono, email')
                .eq('empresa_id', empresaId)
                .eq('activo', true)
                .limit(200);

            if (clientes) {
                await offlineDB.cacheClientes(clientes);
                console.log(`[Cache] ${clientes.length} clientes cached`);
            }

            // Cache recent ordenes
            const { data: ordenes } = await supabase
                .from('ordenes_servicio')
                .select('id, numero_orden, equipo, marca, modelo, estado, cliente_id')
                .eq('empresa_id', empresaId)
                .neq('estado', 'entregado')
                .order('created_at', { ascending: false })
                .limit(50);

            if (ordenes) {
                await offlineDB.cacheOrdenes(ordenes);
                console.log(`[Cache] ${ordenes.length} ordenes cached`);
            }

        } catch (error) {
            console.error('[Cache] Error caching data:', error);
        }
    }

    // Save data when offline
    async saveOffline(table: string, action: 'insert' | 'update' | 'delete', data: any): Promise<void> {
        await offlineDB.addToSyncQueue({ table, action, data });
        console.log(`[Offline] Saved to sync queue: ${table} ${action}`);
    }
}

// Singleton instance
export const syncManager = new SyncManager();
