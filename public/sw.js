
// Cache names
const CACHE_NAME = 'cbs-interview-scheduler-v2';
const DYNAMIC_CACHE = 'cbs-dynamic-cache-v2';
const API_CACHE = 'cbs-api-cache-v2';

// App shell files to cache on install
const appShellFiles = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// Install event - cache app shell assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching App Shell');
        return cache.addAll(appShellFiles);
      })
      .then(() => {
        console.log('[Service Worker] Successfully installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== DYNAMIC_CACHE && key !== API_CACHE) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => {
      // Immediately take control of all pages
      return self.clients.claim();
    })
  );
});

// Improved fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isAPIRequest = url.pathname.includes('/api/') || 
                       url.pathname.includes('/rest/') || 
                       url.host.includes('supabase');
  
  // Don't cache POST requests or API requests during offline operations
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  if (isAPIRequest) {
    // For API requests, use network-first strategy
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses for offline use
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Try to get from cache if network fails
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If nothing in cache, return offline fallback
              return caches.match('/offline.html');
            });
        })
    );
  } else {
    // For static assets, use cache-first strategy with network update
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached response immediately
          if (response) {
            // Update cache in background
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse.ok) {
                  caches.open(DYNAMIC_CACHE)
                    .then(cache => cache.put(event.request, networkResponse));
                }
              })
              .catch(() => {});
            return response;
          }
          
          // No cached response, try network
          return fetch(event.request)
            .then((res) => {
              // Check if we received a valid response
              if (!res || res.status !== 200 || res.type !== 'basic') {
                return res;
              }
              
              // Clone the response as it can only be consumed once
              const responseToCache = res.clone();
              
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return res;
            })
            .catch(() => {
              // If offline and trying to access a page, show the offline page
              if (event.request.mode === 'navigate') {
                return caches.match('/offline.html');
              }
            });
        })
    );
  }
});

// Improved sync handling with more robust retries
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing', event);
  
  if (event.tag === 'sync-sessions') {
    console.log('[Service Worker] Syncing Sessions and Interviews');
    
    // Post a message to the client to initiate the sync
    self.clients.matchAll().then((clients) => {
      if (clients.length === 0) {
        // No active clients, try again later
        registration.sync.register('sync-sessions');
        return;
      }
      
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_SESSIONS'
        });
      });
    });
  }
});

// Handle periodic sync events with better reliability
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-sessions') {
    console.log('[Service Worker] Periodic Sync: Syncing sessions and interviews');
    
    self.clients.matchAll().then((clients) => {
      if (clients.length === 0) {
        // Store sync request for when app is opened next
        self.registration.showNotification('Sync Pending', {
          body: 'Data sync pending. Please open the app to complete.',
          icon: '/icons/icon-192x192.png'
        });
        return;
      }
      
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_SESSIONS'
        });
      });
    });
  }
});

// Improved message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    // Manual sync request from client
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_SESSIONS'
        });
      });
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Listen for push notifications
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');

  const title = 'Data Sync Required';
  const options = {
    body: 'You have offline data that needs to be synchronized.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
