
// Cache names - use consistent versioning
const CACHE_NAME = 'cbs-interview-scheduler-v4'; // Incremented version
const DYNAMIC_CACHE = 'cbs-dynamic-cache-v4';
const API_CACHE = 'cbs-api-cache-v4';

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

// Track sync state to prevent multiple operations
self.syncInProgress = false;
self.syncStartTime = null;
self.syncTimeout = null;
self.syncQueue = [];

// Process sync queue one at a time
function processNextSyncInQueue() {
  if (self.syncQueue.length === 0 || self.syncInProgress) {
    return;
  }
  
  const nextSync = self.syncQueue.shift();
  handleSyncRequest(nextSync.tag, nextSync.event);
}

// Handle sync request with proper tracking
function handleSyncRequest(tag, event) {
  if (self.syncInProgress) {
    console.log('[Service Worker] Sync already in progress, queueing request');
    self.syncQueue.push({ tag, event });
    return;
  }
  
  // Set sync in progress flag with a timeout
  self.syncInProgress = true;
  self.syncStartTime = Date.now();
  
  // Set a timeout to auto-clear the flag if sync gets stuck
  self.syncTimeout = setTimeout(() => {
    console.log('[Service Worker] Sync operation timed out after 5 minutes');
    self.syncInProgress = false;
    self.syncStartTime = null;
    clearTimeout(self.syncTimeout);
    self.syncTimeout = null;
    
    // Process next sync in queue
    processNextSyncInQueue();
  }, 5 * 60 * 1000); // 5 minutes maximum sync time
  
  // Post a message to clients with a unique sync ID to prevent duplicate processing
  const syncId = `sw-sync-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  self.clients.matchAll().then((clients) => {
    if (clients.length === 0) {
      // No active clients, will try again later
      console.log('[Service Worker] No active clients, will sync later');
      self.syncInProgress = false;
      clearTimeout(self.syncTimeout);
      self.syncStartTime = null;
      self.syncTimeout = null;
      
      // Re-queue for later
      self.syncQueue.push({ tag, event });
      return;
    }
    
    // Find the most recently focused client
    clients.sort((a, b) => {
      return b.focused - a.focused;
    });
    
    // Send sync message to the focused client
    const client = clients[0];
    console.log('[Service Worker] Sending sync request to client');
    client.postMessage({
      type: 'SYNC_SESSIONS',
      timestamp: new Date().toISOString(),
      syncId: syncId,
      source: tag
    });
  });
}

// Improved sync handling with queuing mechanism
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing', event.tag);
  
  if (event.tag === 'sync-sessions' || event.tag === 'sync-sessions-retry') {
    // Queue the sync operation
    self.syncQueue.push({ tag: event.tag, event });
    
    // Process the queue
    processNextSyncInQueue();
  }
});

// Handle periodic sync events with smart scheduling based on device state
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-sessions') {
    console.log('[Service Worker] Periodic Sync: Syncing sessions and interviews');
    
    // Queue the sync operation
    self.syncQueue.push({ tag: 'periodic-sync', event });
    
    // Process the queue
    processNextSyncInQueue();
  }
});

// Improved message handler with sync ID tracking
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    // Manual sync request from client
    console.log('[Service Worker] Received manual sync request');
    
    // Queue the sync operation with the provided ID
    self.syncQueue.push({ 
      tag: 'manual-sync', 
      event,
      syncId: event.data.syncId 
    });
    
    // Process the queue
    processNextSyncInQueue();
  } else if (event.data && event.data.type === 'SYNC_COMPLETE') {
    // Sync complete notification from client
    console.log('[Service Worker] Sync complete notification received');
    
    // Clear sync in progress flag
    self.syncInProgress = false;
    if (self.syncTimeout) {
      clearTimeout(self.syncTimeout);
      self.syncTimeout = null;
    }
    self.syncStartTime = null;
    
    // Process next sync in queue
    processNextSyncInQueue();
    
    // Clear any pending sync notifications
    self.registration.getNotifications({ tag: 'sync-notification' })
      .then(notifications => {
        notifications.forEach(notification => notification.close());
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
    badge: '/icons/badge-72x72.png',
    tag: 'sync-notification',
    requireInteraction: true
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
