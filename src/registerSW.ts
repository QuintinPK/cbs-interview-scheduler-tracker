
import { Workbox } from 'workbox-window';
import { syncQueue, initializeSyncQueue } from './lib/syncQueue';
import { isOnline } from './lib/offlineDB';

// Check if the browser supports service workers
const isServiceWorkerSupported = 'serviceWorker' in navigator;

// Initialize the sync system
export const initializeSync = async () => {
  try {
    console.log("[App] Initializing sync system");
    await initializeSyncQueue();
    console.log("[App] Sync system initialized");
    return true;
  } catch (error) {
    console.error("[App] Error initializing sync system:", error);
    return false;
  }
};

// Register the service worker
export const registerSW = () => {
  if (isServiceWorkerSupported) {
    const wb = new Workbox('/sw.js');

    // Add event listeners
    wb.addEventListener('installed', event => {
      console.log('[ServiceWorker] Installed');
      if (!event.isUpdate) {
        console.log('[ServiceWorker] First-time install');
      }
    });

    wb.addEventListener('activated', event => {
      console.log('[ServiceWorker] Activated');
      if (event.isUpdate) {
        // When the service worker is updated, reload the page to ensure the new version is used
        window.location.reload();
      }
    });

    wb.addEventListener('waiting', event => {
      console.log('[ServiceWorker] New version waiting to activate');
      // You could show a notification here that a new version is available
    });

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', async (event) => {
      const { data } = event;
      console.log('[ServiceWorker] Message received:', data);

      if (data.type === 'SYNC_REQUEST') {
        console.log('[ServiceWorker] Sync request received');
        
        if (isOnline()) {
          try {
            await syncQueue.attemptSync();
            
            // Notify the service worker that sync is complete
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'SYNC_COMPLETE',
                timestamp: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error('[ServiceWorker] Error syncing data:', error);
          }
        }
      }
      
      if (data.type === 'ONLINE_STATUS') {
        console.log('[ServiceWorker] Online status updated:', data.isOnline);
        
        // If we just came online, try to sync
        if (data.isOnline && isOnline()) {
          console.log('[ServiceWorker] Now online, attempting sync');
          try {
            await syncQueue.attemptSync();
          } catch (error) {
            console.error('[ServiceWorker] Error syncing data after coming online:', error);
          }
        }
      }
    });

    // Register the service worker
    wb.register()
      .then(registration => {
        console.log('[ServiceWorker] Registration successful');
        
        // Initialize sync system after service worker is registered
        initializeSync().then(syncInitialized => {
          console.log('[ServiceWorker] Sync system initialized:', syncInitialized);
          
          // Notify the service worker that the app is ready
          if (registration.active) {
            registration.active.postMessage({
              type: 'APP_READY',
              timestamp: new Date().toISOString()
            });
          }
        });
      })
      .catch(error => {
        console.error('[ServiceWorker] Registration failed:', error);
      });

    return wb;
  } else {
    console.warn('[ServiceWorker] Service workers are not supported in this browser');
    
    // Still initialize sync system even without service worker
    initializeSync().catch(error => {
      console.error('[App] Error initializing sync without service worker:', error);
    });
    
    return null;
  }
};

// Export a function to check for updates manually
export const checkForUpdates = async () => {
  if (isServiceWorkerSupported) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return true;
    } catch (error) {
      console.error('[ServiceWorker] Update check failed:', error);
      return false;
    }
  }
  return false;
};

// Call registerSW to start the service worker
if (import.meta.env.PROD) {
  registerSW();
} else {
  console.log('[ServiceWorker] Not registering in development mode');
  // Still initialize sync system in dev mode
  initializeSync().catch(error => {
    console.error('[App] Error initializing sync in dev mode:', error);
  });
}
