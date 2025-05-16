
// This file might not exist yet, so I'm creating it

import { initializeSyncQueue, syncQueue } from './lib/syncQueue';

// Initialize sync queue when the app loads
let syncInitialized = false;

export function initializeSync() {
  if (syncInitialized) return;
  
  // Initialize sync queue
  initializeSyncQueue().catch(err => {
    console.error('Error initializing sync queue:', err);
  });
  
  syncInitialized = true;
}

// Attempt to set up service worker for background sync
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Register a periodic sync if supported
        if ('periodicSync' in registration) {
          const tags = await (registration as any).periodicSync.getTags();
          if (!tags.includes('sync-sessions')) {
            try {
              await (registration as any).periodicSync.register('sync-sessions', {
                minInterval: 60 * 60 * 1000, // 1 hour
              });
              console.log('Periodic sync registered.');
            } catch (error) {
              console.log('Periodic sync registration failed:', error);
            }
          }
        }
        
        console.log('ServiceWorker registered for sync');
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    });
  }
}

// Request a one-time sync via the service worker
export function requestSync(): string | null {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  
  try {
    const syncId = `sw-sync-${Date.now()}`;
    
    // Send message to service worker to trigger sync
    navigator.serviceWorker.ready.then(registration => {
      const activeWorker = registration.active;
      if (activeWorker) {
        activeWorker.postMessage({
          type: 'TRIGGER_SYNC',
          syncId
        });
      }
    });
    
    return syncId;
  } catch (error) {
    console.error('Failed to request sync:', error);
    return null;
  }
}

// Initialize sync on script load
initializeSync();

// Export sync queue for external use
export { syncQueue };
