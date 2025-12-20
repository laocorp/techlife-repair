// Service Worker for RepairApp PWA
// Handles caching, offline support, and background sync

const CACHE_NAME = 'repairapp-v1';
const STATIC_CACHE = 'repairapp-static-v1';
const DYNAMIC_CACHE = 'repairapp-dynamic-v1';
const API_CACHE = 'repairapp-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/offline',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// API endpoints to cache with network-first strategy
const API_ROUTES = [
    '/rest/v1/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name !== STATIC_CACHE &&
                                name !== DYNAMIC_CACHE &&
                                name !== API_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // API requests - Network first, fallback to cache
    if (isApiRequest(url)) {
        event.respondWith(networkFirst(request, API_CACHE));
        return;
    }

    // Static assets - Cache first
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // Navigation requests - Network first with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstWithOffline(request));
        return;
    }

    // Dynamic content - Stale while revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Strategy: Cache First
async function cacheFirst(request, cacheName) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Cache first failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

// Strategy: Network First
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network first fallback to cache');
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Strategy: Network First with Offline Page
async function networkFirstWithOffline(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('[SW] Navigation offline, serving cached page');
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Fallback to offline page
        return caches.match('/offline');
    }
}

// Strategy: Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
    const cachedResponse = await caches.match(request);

    const networkResponsePromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                caches.open(cacheName)
                    .then((cache) => cache.put(request, networkResponse.clone()));
            }
            return networkResponse;
        })
        .catch(() => null);

    return cachedResponse || networkResponsePromise;
}

// Helper: Check if API request
function isApiRequest(url) {
    return API_ROUTES.some((route) => url.pathname.includes(route));
}

// Helper: Check if static asset
function isStaticAsset(url) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
    return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

// Background Sync - Queue failed requests
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    if (event.tag === 'sync-pending-orders') {
        event.waitUntil(syncPendingOrders());
    }
    if (event.tag === 'sync-pending-sales') {
        event.waitUntil(syncPendingSales());
    }
});

// Sync pending orders from IndexedDB
async function syncPendingOrders() {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({ type: 'SYNC_ORDERS', status: 'started' });
        });

        // This will be handled by the app's sync logic
        console.log('[SW] Sync orders triggered');
    } catch (error) {
        console.error('[SW] Sync orders failed:', error);
    }
}

async function syncPendingSales() {
    try {
        console.log('[SW] Sync sales triggered');
    } catch (error) {
        console.error('[SW] Sync sales failed:', error);
    }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.openWindow(url)
    );
});

// Message from client
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data?.type === 'CACHE_URLS') {
        caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.addAll(event.data.urls));
    }
});
