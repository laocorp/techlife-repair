// src/lib/offline/indexed-db.ts
// IndexedDB wrapper for offline data storage

const DB_NAME = 'repairapp-offline';
const DB_VERSION = 1;

export interface SyncQueueItem {
    id: string;
    table: string;
    action: 'insert' | 'update' | 'delete';
    data: any;
    timestamp: number;
    retries: number;
}

export interface CachedData {
    key: string;
    data: any;
    timestamp: number;
    expiresAt: number | null;
}

// Database stores
const STORES = {
    SYNC_QUEUE: 'sync-queue',
    ORDENES: 'ordenes',
    PRODUCTOS: 'productos',
    CLIENTES: 'clientes',
    VENTAS: 'ventas',
    CACHE: 'cache',
};

class OfflineDB {
    private db: IDBDatabase | null = null;
    private dbPromise: Promise<IDBDatabase> | null = null;

    async init(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Error opening IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Sync queue for pending operations
                if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                    const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    syncStore.createIndex('table', 'table', { unique: false });
                }

                // Ordenes cache
                if (!db.objectStoreNames.contains(STORES.ORDENES)) {
                    const ordenesStore = db.createObjectStore(STORES.ORDENES, { keyPath: 'id' });
                    ordenesStore.createIndex('numero_orden', 'numero_orden', { unique: true });
                    ordenesStore.createIndex('estado', 'estado', { unique: false });
                }

                // Productos cache
                if (!db.objectStoreNames.contains(STORES.PRODUCTOS)) {
                    const productosStore = db.createObjectStore(STORES.PRODUCTOS, { keyPath: 'id' });
                    productosStore.createIndex('codigo', 'codigo', { unique: false });
                    productosStore.createIndex('nombre', 'nombre', { unique: false });
                }

                // Clientes cache
                if (!db.objectStoreNames.contains(STORES.CLIENTES)) {
                    const clientesStore = db.createObjectStore(STORES.CLIENTES, { keyPath: 'id' });
                    clientesStore.createIndex('identificacion', 'identificacion', { unique: false });
                }

                // Ventas offline
                if (!db.objectStoreNames.contains(STORES.VENTAS)) {
                    const ventasStore = db.createObjectStore(STORES.VENTAS, { keyPath: 'id' });
                    ventasStore.createIndex('created_at', 'created_at', { unique: false });
                }

                // General cache
                if (!db.objectStoreNames.contains(STORES.CACHE)) {
                    db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
                }

                console.log('IndexedDB schema created');
            };
        });

        return this.dbPromise;
    }

    // Generic put operation
    async put<T>(storeName: string, data: T): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Generic get operation
    async get<T>(storeName: string, key: string): Promise<T | undefined> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all from store
    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete from store
    async delete(storeName: string, key: string): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Clear store
    async clear(storeName: string): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Add to sync queue
    async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
        const queueItem: SyncQueueItem = {
            ...item,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            retries: 0,
        };
        await this.put(STORES.SYNC_QUEUE, queueItem);
    }

    // Get pending sync items
    async getPendingSyncItems(): Promise<SyncQueueItem[]> {
        return this.getAll(STORES.SYNC_QUEUE);
    }

    // Remove from sync queue
    async removeSyncItem(id: string): Promise<void> {
        await this.delete(STORES.SYNC_QUEUE, id);
    }

    // Increment retry count
    async incrementRetry(id: string): Promise<void> {
        const item = await this.get<SyncQueueItem>(STORES.SYNC_QUEUE, id);
        if (item) {
            item.retries++;
            await this.put(STORES.SYNC_QUEUE, item);
        }
    }

    // Cache data with expiration
    async cacheData(key: string, data: any, ttlSeconds?: number): Promise<void> {
        const cached: CachedData = {
            key,
            data,
            timestamp: Date.now(),
            expiresAt: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null,
        };
        await this.put(STORES.CACHE, cached);
    }

    // Get cached data
    async getCachedData<T>(key: string): Promise<T | null> {
        const cached = await this.get<CachedData>(STORES.CACHE, key);
        if (!cached) return null;

        // Check expiration
        if (cached.expiresAt && Date.now() > cached.expiresAt) {
            await this.delete(STORES.CACHE, key);
            return null;
        }

        return cached.data as T;
    }

    // Store ordenes for offline access
    async cacheOrdenes(ordenes: any[]): Promise<void> {
        for (const orden of ordenes) {
            await this.put(STORES.ORDENES, orden);
        }
    }

    // Get cached ordenes
    async getCachedOrdenes(): Promise<any[]> {
        return this.getAll(STORES.ORDENES);
    }

    // Store productos for offline POS
    async cacheProductos(productos: any[]): Promise<void> {
        for (const producto of productos) {
            await this.put(STORES.PRODUCTOS, producto);
        }
    }

    // Get cached productos
    async getCachedProductos(): Promise<any[]> {
        return this.getAll(STORES.PRODUCTOS);
    }

    // Store clientes
    async cacheClientes(clientes: any[]): Promise<void> {
        for (const cliente of clientes) {
            await this.put(STORES.CLIENTES, cliente);
        }
    }

    // Get cached clientes
    async getCachedClientes(): Promise<any[]> {
        return this.getAll(STORES.CLIENTES);
    }

    // Save offline venta
    async saveOfflineVenta(venta: any): Promise<void> {
        await this.put(STORES.VENTAS, venta);
        await this.addToSyncQueue({
            table: 'ventas',
            action: 'insert',
            data: venta,
        });
    }

    // Get offline ventas
    async getOfflineVentas(): Promise<any[]> {
        return this.getAll(STORES.VENTAS);
    }
}

// Singleton instance
export const offlineDB = new OfflineDB();

// Export store names for external use
export { STORES };
