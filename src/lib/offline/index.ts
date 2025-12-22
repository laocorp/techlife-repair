// src/lib/offline/index.ts
// Export all offline utilities

export { offlineDB, STORES } from './indexed-db';
export type { SyncQueueItem, CachedData } from './indexed-db';
export { syncManager } from './sync-manager';
