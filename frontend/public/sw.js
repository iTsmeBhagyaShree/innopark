// Service Worker for Develo CRM PWA
// Version 1.0.0

const CACHE_NAME = 'develo-crm-cache-v2';
const RUNTIME_CACHE = 'runtime-cache-v2';

// Static assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching static assets');
                return cache.addAll(PRECACHE_ASSETS).catch((error) => {
                    console.warn('[SW] Some assets failed to cache:', error);
                    // Continue even if some assets fail
                    return Promise.resolve();
                });
            })
            .then(() => {
                console.log('[SW] Installation complete');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip API calls, auth, and external requests (don't cache these)
    // IMPORTANT: Don't respond to these requests at all - let browser handle them
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.includes('auth') ||
        url.pathname.includes('login') ||
        url.pathname.includes('logout') ||
        url.pathname.includes('@react-refresh') || // Vite specific
        url.pathname.includes('@vite') || // Vite specific
        url.pathname.includes('node_modules') || // Vite specific
        url.pathname.includes('src/') || // Vite source files
        url.origin !== self.location.origin
    ) {
        // Don't respond - let browser handle these requests normally
        return;
    }

    // For navigation requests (HTML pages) - network first, cache fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the response
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone).catch(() => {
                                // Ignore cache errors
                            });
                        }).catch(() => {
                            // Ignore cache open errors
                        });
                    }
                    return response;
                })
                .catch((error) => {
                    console.warn('[SW] Navigation fetch failed:', error);
                    // If offline, try cache then fallback to index.html
                    return caches.match(request)
                        .then((cachedResponse) => {
                            return cachedResponse || caches.match('/index.html');
                        })
                        .catch(() => {
                            // If cache match also fails, return basic response
                            return new Response('Offline', {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: { 'Content-Type': 'text/plain' }
                            });
                        });
                })
        );
        return;
    }

    // For static assets - cache first, network fallback
    if (
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.woff2')
    ) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request)
                        .then((response) => {
                            if (!response || response.status !== 200) {
                                return response;
                            }

                            const responseClone = response.clone();
                            caches.open(RUNTIME_CACHE).then((cache) => {
                                cache.put(request, responseClone).catch(() => {
                                    // Ignore cache errors
                                });
                            }).catch(() => {
                                // Ignore cache open errors
                            });

                            return response;
                        })
                        .catch((error) => {
                            console.warn('[SW] Fetch failed for static asset:', request.url, error);
                            // Return cached response if available
                            return caches.match(request).then((cachedResponse) => {
                                return cachedResponse || new Response('Network error', {
                                    status: 408,
                                    statusText: 'Request Timeout',
                                    headers: { 'Content-Type': 'text/plain' }
                                });
                            });
                        });
                })
        );
        return;
    }

    // Default: network only (for API-like requests not caught above)
    // Add proper error handling to prevent "Failed to fetch" errors
    // IMPORTANT: Only respond if we haven't already returned above
    try {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Only cache successful responses
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone).catch(() => {
                                // Ignore cache errors silently
                            });
                        }).catch(() => {
                            // Ignore cache open errors silently
                        });
                    }
                    return response;
                })
                .catch((error) => {
                    // Silent error handling - don't log to avoid console spam
                    // Try to get from cache as fallback
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // If no cache and fetch failed, return a basic error response
                        // This prevents unhandled promise rejection
                        return new Response('', {
                            status: 408,
                            statusText: 'Request Timeout',
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    }).catch(() => {
                        // Final fallback if everything fails
                        return new Response('', {
                            status: 408,
                            statusText: 'Request Timeout',
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
                })
        );
    } catch (error) {
        // If respondWith fails, just ignore - browser will handle the request
        console.warn('[SW] Could not respond to request:', error);
    }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: '1.0.0' });
    }
});

console.log('[SW] Service Worker script loaded');
