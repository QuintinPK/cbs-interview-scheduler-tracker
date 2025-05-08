
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
}

// Listen for messages from service worker
export function listenForSWMessages() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'SYNC_SESSIONS') {
        try {
          // Import dynamically to avoid circular dependencies
          const { syncOfflineSessions } = await import('./lib/offlineDB');
          await syncOfflineSessions();
        } catch (error) {
          console.error('Error syncing from SW message:', error);
        }
      }
    });
  }
}

export function registerBackgroundSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Register periodic sync if available (Chrome origin trial)
      if ('periodicSync' in registration) {
        const periodicSync = registration.periodicSync as unknown as {
          register: (options: { tag: string; minInterval: number }) => Promise<void>
        };
        
        if (periodicSync) {
          periodicSync.register({
            tag: 'sync-sessions',
            minInterval: 60 * 60 * 1000 // Sync every hour
          }).catch(error => {
            console.log('Periodic background sync failed to register: ', error);
          });
        }
      }
      
      // Register one-time sync if available
      if ('sync' in registration) {
        const sync = registration.sync as unknown as {
          register: (tag: string) => Promise<void>
        };
        
        sync.register('sync-sessions').catch(error => {
          console.log('Background sync failed to register: ', error);
        });
      }
    });
  }
}

// Trigger manual sync when online
export function setupOnlineListener() {
  window.addEventListener('online', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if ('sync' in registration) {
          const sync = registration.sync as unknown as {
            register: (tag: string) => Promise<void>
          };
          
          sync.register('sync-sessions').catch(error => {
            console.log('Background sync failed to register: ', error);
          });
        }
      });
    }
  });
}
