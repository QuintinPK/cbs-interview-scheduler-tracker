
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registration successful with scope:', registration.scope);
        
        // Check if there's an update and force activation if needed
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New service worker available, notify user
                  console.log('New service worker installed and ready for use');
                  
                  // Force the waiting service worker to become active
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              }
            });
          }
        });
      } catch (err) {
        console.error('ServiceWorker registration failed:', err);
      }
    });
    
    // When a service worker takes over, refresh the page to ensure
    // the new service worker controls the page
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('New service worker activated, reloading for a fresh start');
        window.location.reload();
      }
    });
  }
}

// Enhanced listener for service worker messages with timeouts
export function listenForSWMessages() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'SYNC_SESSIONS') {
        try {
          console.log('Received sync request from service worker');
          // Import dynamically to avoid circular dependencies
          const { syncOfflineSessions } = await import('./lib/offlineDB');
          
          // Use AbortController to allow timeout
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
          
          try {
            // Wrap in timeout to prevent long-running sync
            await Promise.race([
              syncOfflineSessions(),
              new Promise((_, reject) => {
                abortController.signal.addEventListener('abort', () => {
                  reject(new Error('Sync operation timed out'));
                });
              })
            ]);
            console.log('Background sync completed successfully');
          } catch (error) {
            if (error.name === 'AbortError') {
              console.warn('Sync operation took too long and was aborted');
            } else {
              throw error;
            }
          } finally {
            clearTimeout(timeoutId);
          }
        } catch (error) {
          console.error('Error syncing from SW message:', error);
        }
      }
    });
  }
}

// Request sync immediately
export function requestSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({ type: 'SYNC_NOW' });
    });
  }
}

// Enhanced background sync registration
export function registerBackgroundSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Register periodic sync if available (Chrome origin trial)
      if ('periodicSync' in registration) {
        const periodicSync = registration.periodicSync as unknown as {
          register: (options: { tag: string; minInterval: number }) => Promise<void>;
          getTags: () => Promise<string[]>;
        };
        
        if (periodicSync) {
          // Check if already registered first
          periodicSync.getTags().then(tags => {
            if (!tags.includes('sync-sessions')) {
              periodicSync.register({
                tag: 'sync-sessions',
                minInterval: 15 * 60 * 1000 // Sync every 15 minutes
              }).catch(error => {
                console.log('Periodic background sync failed to register:', error);
              });
            }
          });
        }
      }
      
      // Register one-time sync if available
      if ('sync' in registration) {
        const sync = registration.sync as unknown as {
          register: (tag: string) => Promise<void>;
        };
        
        sync.register('sync-sessions').catch(error => {
          console.log('Background sync failed to register:', error);
        });
      }
    });
  }
}

// Trigger manual sync when online with debounce
let syncTimeout: number | null = null;
export function setupOnlineListener() {
  window.addEventListener('online', () => {
    // Debounce to prevent multiple syncs when the connection is unstable
    if (syncTimeout) {
      window.clearTimeout(syncTimeout);
    }
    
    syncTimeout = window.setTimeout(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          // First try using background sync API
          if ('sync' in registration) {
            const sync = registration.sync as unknown as {
              register: (tag: string) => Promise<void>;
            };
            
            sync.register('sync-sessions').catch(async error => {
              console.log('Background sync failed to register:', error);
              
              // Fall back to manual sync if background sync fails
              try {
                const { syncOfflineSessions } = await import('./lib/offlineDB');
                await syncOfflineSessions();
              } catch (err) {
                console.error('Manual sync fallback failed:', err);
              }
            });
          } else {
            // Fall back to manual sync if background sync is not supported
            import('./lib/offlineDB').then(({ syncOfflineSessions }) => {
              syncOfflineSessions();
            });
          }
        });
      }
    }, 1000); // Wait 1 second after coming online before syncing
  });
}

// Initialize all service worker functionality
export function initServiceWorkers() {
  registerServiceWorker();
  listenForSWMessages();
  registerBackgroundSync();
  setupOnlineListener();
}
