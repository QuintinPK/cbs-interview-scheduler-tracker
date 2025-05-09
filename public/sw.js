
// Cache names
const CACHE_NAME = 'cbs-interview-scheduler-v3';
const DYNAMIC_CACHE = 'cbs-dynamic-cache-v3';
const API_CACHE = 'cbs-api-cache-v3';

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

// Improved sync handling with limits on concurrent operations
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing', event);
  
  if (event.tag === 'sync-sessions') {
    console.log('[Service Worker] Syncing Sessions and Interviews');
    
    // Check if sync is currently in progress from another source
    const syncInProgress = self.syncInProgress;
    if (syncInProgress) {
      console.log('[Service Worker] Sync already in progress, deferring');
      // Schedule a retry after a delay
      setTimeout(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            if (registration.sync) {
              registration.sync.register('sync-sessions-retry');
            }
          });
        }
      }, 60000); // Try again in 1 minute
      return;
    }
    
    // Set sync in progress flag with a timeout
    self.syncInProgress = true;
    self.syncStartTime = Date.now();
    
    // Set a timeout to auto-clear the flag if sync gets stuck
    self.syncTimeout = setTimeout(() => {
      console.log('[Service Worker] Sync operation timed out after 5 minutes');
      self.syncInProgress = false;
      delete self.syncStartTime;
      delete self.syncTimeout;
    }, 5 * 60 * 1000); // 5 minutes maximum sync time
    
    // Post a message to clients with a unique sync ID to prevent duplicate processing
    const syncId = `sw-sync-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    self.clients.matchAll().then((clients) => {
      if (clients.length === 0) {
        // No active clients, will try again later
        console.log('[Service Worker] No active clients, will sync later');
        self.syncInProgress = false;
        clearTimeout(self.syncTimeout);
        delete self.syncStartTime;
        delete self.syncTimeout;
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
        syncId: syncId
      });
    });
  }
  
  // Handle retry sync events
  if (event.tag === 'sync-sessions-retry') {
    // Only try if the previous sync has completed or timed out
    if (!self.syncInProgress || (Date.now() - self.syncStartTime > 5 * 60 * 1000)) {
      console.log('[Service Worker] Retrying sync');
      // Clear any stale flags
      self.syncInProgress = false;
      if (self.syncTimeout) {
        clearTimeout(self.syncTimeout);
        delete self.syncTimeout;
      }
      delete self.syncStartTime;
      
      // Re-register the main sync task
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          if (registration.sync) {
            registration.sync.register('sync-sessions');
          }
        });
      }
    }
  }
});

// Handle periodic sync events with smart scheduling based on device state
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-sessions') {
    console.log('[Service Worker] Periodic Sync: Syncing sessions and interviews');
    
    // Check if sync is already in progress
    if (self.syncInProgress) {
      console.log('[Service Worker] Periodic sync skipped - sync already in progress');
      return;
    }
    
    // Smart device state detection - check battery if available
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        // Don't sync if battery is low and not charging
        if (battery.level < 0.15 && !battery.charging) {
          console.log('[Service Worker] Skipping sync due to low battery');
          return;
        }
        
        initiatePeriodicSync();
      }).catch(() => {
        // If we can't check battery, just proceed
        initiatePeriodicSync();
      });
    } else {
      initiatePeriodicSync();
    }
  }
});

// Helper function for periodic sync
function initiatePeriodicSync() {
  self.clients.matchAll().then((clients) => {
    if (clients.length === 0) {
      // Store sync request for when app is opened next
      self.registration.showNotification('Sync Pending', {
        body: 'Data sync pending. Please open the app to complete.',
        icon: '/icons/icon-192x192.png',
        tag: 'sync-notification',
        requireInteraction: false
      });
      return;
    }
    
    // Set sync in progress flag
    self.syncInProgress = true;
    self.syncStartTime = Date.now();
    
    // Set a timeout to auto-clear the flag if sync gets stuck
    self.syncTimeout = setTimeout(() => {
      self.syncInProgress = false;
      delete self.syncStartTime;
      delete self.syncTimeout;
    }, 5 * 60 * 1000); // 5 minutes maximum sync time
    
    // Generate unique sync ID
    const syncId = `periodic-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Sort clients by focus state
    clients.sort((a, b) => b.focused - a.focused);
    
    // Send to the most recently active client
    clients[0].postMessage({
      type: 'SYNC_SESSIONS',
      timestamp: new Date().toISOString(),
      source: 'periodic',
      syncId: syncId
    });
  });
}

// Improved message handler with sync ID tracking
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    // Manual sync request from client
    console.log('[Service Worker] Received manual sync request');
    
    // Don't start a new sync if one is already in progress
    if (self.syncInProgress) {
      console.log('[Service Worker] Manual sync request denied - sync already in progress');
      
      // If the sync has been running too long, force reset
      if (Date.now() - self.syncStartTime > 5 * 60 * 1000) {
        console.log('[Service Worker] Forcing reset of stale sync lock');
        self.syncInProgress = false;
        if (self.syncTimeout) {
          clearTimeout(self.syncTimeout);
          delete self.syncTimeout;
        }
        delete self.syncStartTime;
      } else {
        return;
      }
    }
    
    // Set sync in progress flag
    self.syncInProgress = true;
    self.syncStartTime = Date.now();
    
    // Set a timeout to auto-clear the flag if sync gets stuck
    self.syncTimeout = setTimeout(() => {
      self.syncInProgress = false;
      delete self.syncStartTime;
      delete self.syncTimeout;
    }, 5 * 60 * 1000); // 5 minutes maximum sync time
    
    // Generate unique sync ID
    const syncId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        // Sort clients by focus state
        clients.sort((a, b) => b.focused - a.focused);
        
        // Send to the most recently active client
        clients[0].postMessage({
          type: 'SYNC_SESSIONS',
          timestamp: new Date().toISOString(),
          source: 'manual',
          syncId: syncId
        });
      } else {
        // No clients available to handle sync
        self.syncInProgress = false;
        if (self.syncTimeout) {
          clearTimeout(self.syncTimeout);
          delete self.syncTimeout;
        }
        delete self.syncStartTime;
      }
    });
  } else if (event.data && event.data.type === 'SYNC_COMPLETE') {
    // Sync complete notification from client
    console.log('[Service Worker] Sync complete notification received');
    
    // Clear sync in progress flag
    self.syncInProgress = false;
    if (self.syncTimeout) {
      clearTimeout(self.syncTimeout);
      delete self.syncTimeout;
    }
    delete self.syncStartTime;
    
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

// Helper function to determine network conditions
async function getNetworkConditions() {
  // Check if Network Information API is available
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return {
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlinkMax: connection.downlinkMax,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  
  // Fallback when API not available
  return {
    type: 'unknown',
    effectiveType: 'unknown',
    saveData: false
  };
}
