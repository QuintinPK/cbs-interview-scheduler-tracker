
import { register } from 'register-service-worker';
import { logSync } from './lib/offlineDB';

// Define the type for sync event types to avoid deep instantiations
type SyncEventType = 'ServiceWorker' | 'Session' | 'Interview' | 'Data';

// Register service worker for production
export function registerServiceWorker() {
  if (process.env.NODE_ENV === 'production') {
    register(`${process.env.BASE_URL || ''}service-worker.js`, {
      ready () {
        console.log(
          'App is being served from cache by service worker.\n' +
          'For more details, visit https://goo.gl/AFskqB'
        );
      },
      registered () {
        console.log('Service worker has been registered.');
      },
      cached () {
        console.log('Content has been cached for offline use.');
      },
      updatefound () {
        console.log('New content is downloading.');
      },
      updated () {
        console.log('New content is available; please refresh.');
      },
      offline () {
        console.log('No internet connection found. App is running in offline mode.');
      },
      error (error) {
        console.error('Error during service worker registration:', error);
      }
    });
  }

  // Register service worker for development too
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service worker registered successfully:', registration);
        logSync('ServiceWorker', 'RegisterSuccess', 'success', 'Service worker registered successfully');

        // Listen for updates to the service worker
        registration.addEventListener('updatefound', () => {
          console.log('New service worker found, installing.');
          logSync('ServiceWorker', 'UpdateFound', 'success', 'New service worker found, installing.');

          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              console.log('Service worker installed.');
              logSync('ServiceWorker', 'Installed', 'success', 'Service worker installed.');

              if (navigator.serviceWorker.controller) {
                console.log('New content is available; please refresh.');
                logSync('ServiceWorker', 'NewContentAvailable', 'success', 'New content is available; please refresh.');
              } else {
                console.log('Content is cached for offline use.');
                logSync('ServiceWorker', 'ContentCached', 'success', 'Content is cached for offline use.');
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('Service worker registration failed:', error);
        logSync('ServiceWorker', 'RegisterFailed', 'error', `Service worker registration failed: ${error}`);
      });
  }
}

// Function to request a background sync
export async function requestSync(): Promise<string | undefined> {
  if (!('serviceWorker' in navigator && 'SyncManager' in window)) {
    console.warn('SyncManager not available');
    return undefined;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Generate a unique tag for this sync
    const syncTag = `sync-sessions-${Date.now()}`;
    
    // Request the sync
    await registration.sync.register(syncTag);
    
    console.log('Sync requested with tag:', syncTag);
    await logSync('ServiceWorker', 'SyncRequested', 'success', `Background sync requested with tag: ${syncTag}`);
    
    return syncTag;
  } catch (error) {
    console.error('Error requesting sync:', error);
    await logSync('ServiceWorker', 'SyncError', 'error', `Error requesting background sync: ${error}`);
    return undefined;
  }
}

// Listen for messages from the service worker
export function listenForSWMessages() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      console.log("Main thread received message:", event.data);
    });
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('A new service worker has taken control.');
      logSync('ServiceWorker', 'ControllerChange', 'success', 'A new service worker has taken control.');
    });

    // Detect when a new service worker is waiting to activate
    navigator.serviceWorker.addEventListener('waiting', (event) => {
      console.log('Service worker waiting to activate.');
      logSync('ServiceWorker', 'WaitingToActivate', 'success', 'Service worker waiting to activate.');
    });

    // Detect when a service worker becomes redundant
    navigator.serviceWorker.addEventListener('redundant', (event) => {
      console.log('Service worker became redundant.');
      logSync('ServiceWorker', 'Redundant', 'success', 'Service worker became redundant.');
    });

    // Detect when a service worker is activated
    navigator.serviceWorker.addEventListener('activate', (event) => {
      console.log('Service worker activated.');
      logSync('ServiceWorker', 'Activated', 'success', 'Service worker activated.');
    });

    // Detect when a service worker is installed
    navigator.serviceWorker.addEventListener('install', (event) => {
      console.log('Service worker installed.');
      logSync('ServiceWorker', 'Installed', 'success', 'Service worker installed.');
    });

    // Detect when a service worker is controlled
    navigator.serviceWorker.addEventListener('controllerchange', (event) => {
      console.log('Service worker controlled.');
      logSync('ServiceWorker', 'Controlled', 'success', 'Service worker controlled.');
    });
  }
}

// Setup online status listener
export function setupOnlineListener() {
  window.addEventListener('online', () => {
    console.log('App is online');
    document.dispatchEvent(new CustomEvent('app-online'));
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    document.dispatchEvent(new CustomEvent('app-offline'));
  });
}
