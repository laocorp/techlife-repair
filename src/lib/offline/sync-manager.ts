import { offlineDB, SyncQueueItem } from './indexed-db';

type SyncStatus = 'idle' | 'syncing' | 'error';
type NetworkStatusCallback = (isOnline: boolean) => void;

class SyncManager {
    private listeners: Set<NetworkStatusCallback> = new Set();
    private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
    private status: SyncStatus = 'idle';

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', this.handleOnline);
            window.addEventListener('offline', this.handleOffline);
        }
    }

    private handleOnline = () => {
        this.isOnline = true;
        this.notifyListeners();
        this.sync(); // Auto sync when coming back online
    };

    private handleOffline = () => {
        this.isOnline = false;
        this.notifyListeners();
    };

    subscribe(callback: NetworkStatusCallback) {
        this.listeners.add(callback);
        // Initial call
        callback(this.isOnline);
        return () => {
            this.listeners.delete(callback);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(cb => cb(this.isOnline));
    }

    async sync() {
        if (!this.isOnline || this.status === 'syncing') return;

        try {
            this.status = 'syncing';
            const pendingItems = await offlineDB.getPendingSyncItems();

            if (pendingItems.length === 0) return;

            // Process items one by one
            for (const item of pendingItems) {
                try {
                    await this.processItem(item);
                    await offlineDB.removeSyncItem(item.id);
                } catch (error) {
                    console.error(`Failed to sync item ${item.id}`, error);
                    await offlineDB.incrementRetry(item.id);
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
            this.status = 'error';
        } finally {
            this.status = 'idle';
        }
    }

    private async processItem(item: SyncQueueItem) {
        const { table, action, data } = item;
        let url = `/api/${table}`;
        let method = 'POST';

        if (action === 'update') {
            method = 'PUT';
            if (data.id) url += `/${data.id}`;
        } else if (action === 'delete') {
            method = 'DELETE';
            const id = typeof data === 'object' ? data.id : data;
            if (id) url += `/${id}`;
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: action !== 'delete' ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.statusText}`);
        }
    }

    async cacheForOffline(empresaId: string) {
        if (!this.isOnline) return;

        try {
            // Fetch and cache essential data
            const endpoints = ['productos', 'clientes', 'ordenes'];

            for (const endpoint of endpoints) {
                try {
                    const res = await fetch(`/api/${endpoint}?empresaId=${empresaId}`);
                    if (res.ok) {
                        const data = await res.json();
                        switch (endpoint) {
                            case 'productos':
                                await offlineDB.cacheProductos(data);
                                break;
                            case 'clientes':
                                await offlineDB.cacheClientes(data);
                                break;
                            case 'ordenes':
                                await offlineDB.cacheOrdenes(data);
                                break;
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to cache ${endpoint}`, err);
                }
            }
        } catch (error) {
            console.error('Cache for offline error:', error);
        }
    }
}

export const syncManager = new SyncManager();
