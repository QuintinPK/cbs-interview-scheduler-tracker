
// Cache names
const CACHE_NAME = 'cbs-interview-scheduler-v1';
const DYNAMIC_CACHE = 'cbs-dynamic-cache-v1';

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
        if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - handle network requests with cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
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
                // Don't cache API responses
                if (!event.request.url.includes('/api/')) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return res;
          })
          .catch(() => {
            // If offline and trying to access a page, show the offline page
            if (event.request.url.indexOf('.html') > -1 || 
                event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Handle sync events for offline data
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing', event);
  
  if (event.tag === 'sync-sessions') {
    console.log('[Service Worker] Syncing Sessions and Interviews');
    
    // Post a message to the client to initiate the sync
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_SESSIONS'
        });
      });
    });
  }
});

// Handle periodic sync events
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-sessions') {
    console.log('[Service Worker] Periodic Sync: Syncing sessions and interviews');
    
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_SESSIONS'
        });
      });
    });
  }
});
