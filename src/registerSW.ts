import { toast } from "sonner";
import { 
  acquireSyncLock, 
  releaseSyncLock, 
  syncOfflineSessions, 
  getSyncStatus,
  logSync 
} from "./lib/offlineDB";

// Keep track of sync operations to prevent duplicate processing
const processedSyncIds = new Set<string>();
let currentSyncOperation: Promise<any> | null = null;
let syncDebounceTimer: number | null = null;
const SYNC_DEBOUNCE_DELAY = 2000; // 2 seconds

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
                  
                  // Log service worker update
                  logSync('ServiceWorker', 'Updated', 'info', 'Service worker updated successfully')
                    .catch(err => console.error('Error logging service worker update:', err));
                }
              }
            });
          }
        });
      } catch (err) {
        console.error('ServiceWorker registration failed:', err);
        
        // Log service worker registration failure
        logSync('ServiceWorker', 'RegistrationFailed', 'error', `ServiceWorker registration failed: ${err}`)
          .catch(err => console.error('Error logging service worker registration failure:', err));
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

// Enhanced debounced sync function to prevent multiple concurrent syncs
async function debouncedSyncOperation(syncId: string): Promise<boolean> {
  // Check if this sync ID has already been processed recently
  if (processedSyncIds.has(syncId)) {
    console.log(`Already processed sync request with ID: ${syncId}, skipping`);
    return false;
  }
  
  // Add to processed IDs set with expiration (clear after 10 minutes)
  processedSyncIds.add(syncId);
  setTimeout(() => {
    processedSyncIds.delete(syncId);
  }, 10 * 60 * 1000);
  
  // If sync is already in progress, don't start another
  if (currentSyncOperation) {
    console.log('Sync operation already in progress, new request queued');
    
    // Clear the current debounce timer if it exists
    if (syncDebounceTimer !== null) {
      window.clearTimeout(syncDebounceTimer);
    }
    
    // Set a debounce timer to start a new sync after the current one completes
    return new Promise((resolve) => {
      syncDebounceTimer = window.setTimeout(async () => {
        if (currentSyncOperation) {
          try {
            // Wait for current operation to finish
            await currentSyncOperation;
            
            // Then start a new sync operation
            const result = await performSyncOperation(syncId);
            resolve(result);
          } catch (error) {
            console.error('Error waiting for current sync to complete:', error);
            resolve(false);
          }
        } else {
          // Start new sync operation if current one completed
          const result = await performSyncOperation(syncId);
          resolve(result);
        }
      }, SYNC_DEBOUNCE_DELAY);
    });
  }
  
  // Start a new sync operation
  return performSyncOperation(syncId);
}

// Core sync function with improved error handling
async function performSyncOperation(syncId: string): Promise<boolean> {
  // Acquire lock using the provided sync ID
  const lockAcquired = await acquireSyncLock(syncId);
  
  if (!lockAcquired) {
    console.log(`Could not acquire sync lock for ${syncId}, another sync might be in progress`);
    return false;
  }
  
  try {
    // Set current sync operation
    currentSyncOperation = syncOfflineSessions();
    
    // Wait for sync to complete
    const result = await currentSyncOperation;
    
    // Check if there are still items that need syncing
    const status = await getSyncStatus();
    
    if (status.sessionsUnsynced > 0 || status.interviewsUnsynced > 0) {
      console.log(`Sync completed but ${status.sessionsUnsynced} sessions and ${status.interviewsUnsynced} interviews still need syncing`);
      
      // Log partial sync
      await logSync(
        'SyncOperation',
        'PartialSync',
        'warning',
        `Sync completed but ${status.sessionsUnsynced} sessions and ${status.interviewsUnsynced} interviews remain unsynced`
      );
    }
    
    // Notify service worker that sync is complete
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: new Date().toISOString(),
        syncId: syncId,
        result: result
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error during sync operation:', error);
    
    // Log sync error
    await logSync(
      'SyncOperation', 
      'Failed', 
      'error', 
      `Error during sync operation: ${error}`
    );
    
    return false;
  } finally {
    // Clear current sync operation
    currentSyncOperation = null;
    
    // Always release the lock
    await releaseSyncLock(syncId);
  }
}

// Enhanced listener for service worker messages with timeouts and deduplication
export function listenForSWMessages() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'SYNC_SESSIONS') {
        console.log('Received sync request from service worker:', event.data);
        
        const syncId = event.data.syncId || `sw-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        
        try {
          // Check if there's anything to sync
          const status = await getSyncStatus();
          if (status.sessionsUnsynced === 0 && status.interviewsUnsynced === 0) {
            console.log('No unsynced items found, skipping sync operation');
            
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'SYNC_COMPLETE',
                timestamp: new Date().toISOString(),
                syncId: syncId,
                result: true
              });
            }
            
            return;
          }
          
          // Start debounced sync operation
          await debouncedSyncOperation(syncId);
        } catch (error) {
          console.error('Error processing sync request from service worker:', error);
          
          // Log error
          await logSync(
            'ServiceWorkerSync', 
            'Error', 
            'error', 
            `Error processing sync request from service worker: ${error}`
          );
        }
      }
    });
  }
}

// Request sync immediately with unique ID
export function requestSync(): string | null {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const syncId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    navigator.serviceWorker.controller.postMessage({ 
      type: 'SYNC_NOW',
      syncId: syncId
    });
    
    // Log manual sync request
    logSync('SyncRequest', 'ManualRequest', 'info', 'Manual sync requested by user')
      .catch(err => console.error('Error logging manual sync request:', err));
    
    return syncId;
  }
  return null;
}

// Enhanced background sync registration with retry logic
export function registerBackgroundSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(async registration => {
      try {
        // Register one-time sync if available
        if ('sync' in registration) {
          const sync = registration.sync as unknown as {
            register: (tag: string) => Promise<void>;
          };
          
          await sync.register('sync-sessions').catch(async error => {
            console.log('Background sync failed to register:', error);
            
            // Log background sync registration failure
            await logSync(
              'BackgroundSync', 
              'RegistrationFailed', 
              'warning',
              `Background sync failed to register: ${error}`
            );
            
            // Try to register a retry sync after a delay
            setTimeout(async () => {
              if ('sync' in registration) {
                const sync = registration.sync as unknown as {
                  register: (tag: string) => Promise<void>;
                };
                
                try {
                  await sync.register('sync-sessions-retry');
                  
                  // Log retry registration success
                  await logSync(
                    'BackgroundSync', 
                    'RetryRegistered', 
                    'info',
                    'Background sync retry registered'
                  );
                } catch (error) {
                  console.log('Background sync retry failed to register:', error);
                  
                  // Log retry registration failure
                  await logSync(
                    'BackgroundSync', 
                    'RetryRegistrationFailed', 
                    'error',
                    `Background sync retry failed to register: ${error}`
                  );
                }
              }
            }, 60000);
          });
        }
        
        // Register periodic sync if available (Chrome origin trial)
        if ('periodicSync' in registration) {
          const periodicSync = registration.periodicSync as unknown as {
            register: (options: { tag: string; minInterval: number }) => Promise<void>;
            getTags: () => Promise<string[]>;
            unregister: (tag: string) => Promise<void>;
          };
          
          if (periodicSync) {
            // Check if already registered first
            const tags = await periodicSync.getTags();
            if (!tags.includes('sync-sessions')) {
              try {
                await periodicSync.register({
                  tag: 'sync-sessions',
                  minInterval: 15 * 60 * 1000 // Sync every 15 minutes
                });
                
                // Log periodic sync registration success
                await logSync(
                  'PeriodicSync', 
                  'Registered', 
                  'info',
                  'Periodic sync registered successfully'
                );
              } catch (error) {
                console.log('Periodic background sync failed to register:', error);
                
                // Log periodic sync registration failure
                await logSync(
                  'PeriodicSync', 
                  'RegistrationFailed', 
                  'warning',
                  `Periodic sync failed to register: ${error}`
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('Error setting up background sync:', error);
        
        // Log background sync setup failure
        logSync('BackgroundSync', 'SetupFailed', 'error', `Error setting up background sync: ${error}`)
          .catch(err => console.error('Error logging background sync setup failure:', err));
      }
    });
  }
}

// Trigger manual sync when online with debounce and backoff
let syncTimeout: number | null = null;
let syncAttempts = 0;
const MAX_SYNC_ATTEMPTS = 5;
const INITIAL_BACKOFF = 2000; // 2 seconds

export function setupOnlineListener() {
  window.addEventListener('online', () => {
    // Reset attempts counter when we come back online
    syncAttempts = 0;
    
    // Show notification
    toast.success("You're back online! Syncing data...");
    
    // Log online status change
    logSync('NetworkStatus', 'Online', 'info', 'Device came back online')
      .catch(err => console.error('Error logging online status change:', err));
    
    // Debounce to prevent multiple syncs when the connection is unstable
    if (syncTimeout) {
      window.clearTimeout(syncTimeout);
    }
    
    const attemptSync = () => {
      if (syncAttempts >= MAX_SYNC_ATTEMPTS) {
        console.log(`Maximum sync attempts (${MAX_SYNC_ATTEMPTS}) reached, stopping automatic retries`);
        
        // Log max retries reached
        logSync('OnlineSync', 'MaxRetriesReached', 'warning', 
          `Maximum sync attempts (${MAX_SYNC_ATTEMPTS}) reached, stopping automatic retries`
        ).catch(err => console.error('Error logging max retries:', err));
        
        return;
      }
      
      syncAttempts++;
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          // First try using background sync API
          if ('sync' in registration) {
            const sync = registration.sync as unknown as {
              register: (tag: string) => Promise<void>;
            };
            
            sync.register('sync-sessions')
              .then(() => {
                // Log background sync registration success
                return logSync(
                  'OnlineSync', 
                  'BackgroundSyncRegistered', 
                  'info',
                  'Background sync registered after coming online'
                );
              })
              .catch(async error => {
                console.log('Background sync failed to register when coming online:', error);
                
                // Log background sync registration failure
                await logSync(
                  'OnlineSync', 
                  'BackgroundSyncFailed', 
                  'warning',
                  `Background sync failed to register when coming online: ${error}`
                );
                
                // Fall back to manual sync if background sync fails
                try {
                  const syncId = `online-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
                  const result = await debouncedSyncOperation(syncId);
                  
                  if (!result) {
                    // If sync failed, schedule a retry with exponential backoff
                    const backoffDelay = Math.min(30000, Math.pow(2, syncAttempts) * INITIAL_BACKOFF);
                    console.log(`Scheduling sync retry #${syncAttempts+1} in ${backoffDelay/1000} seconds`);
                    
                    // Log retry scheduled
                    await logSync(
                      'OnlineSync', 
                      'RetryScheduled', 
                      'info',
                      `Scheduling sync retry #${syncAttempts+1} in ${backoffDelay/1000} seconds`
                    );
                    
                    syncTimeout = window.setTimeout(() => {
                      attemptSync();
                    }, backoffDelay);
                  }
                } catch (err) {
                  console.error('Manual sync fallback failed:', err);
                  
                  // Log manual sync fallback failure
                  await logSync(
                    'OnlineSync', 
                    'ManualSyncFailed', 
                    'error',
                    `Manual sync fallback failed: ${err}`
                  );
                  
                  // Schedule a retry
                  const backoffDelay = Math.min(30000, Math.pow(2, syncAttempts) * INITIAL_BACKOFF);
                  console.log(`Scheduling sync retry #${syncAttempts+1} in ${backoffDelay/1000} seconds`);
                  
                  syncTimeout = window.setTimeout(() => {
                    attemptSync();
                  }, backoffDelay);
                }
              });
          } else {
            // Fall back to manual sync if background sync is not supported
            const syncId = `online-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
            debouncedSyncOperation(syncId).catch(err => {
              console.error('Manual sync failed when coming online:', err);
              
              // Log manual sync failure
              logSync(
                'OnlineSync', 
                'ManualSyncFailed', 
                'error',
                `Manual sync failed when coming online: ${err}`
              ).catch(err => console.error('Error logging manual sync failure:', err));
            });
          }
        });
      }
    };
    
    // Wait a bit after coming online before syncing
    syncTimeout = window.setTimeout(() => {
      attemptSync();
    }, INITIAL_BACKOFF);
  });
  
  // Also track offline status
  window.addEventListener('offline', () => {
    // Show notification
    toast.warning("You're offline. Changes will be saved locally.");
    
    // Log offline status
    logSync('NetworkStatus', 'Offline', 'info', 'Device went offline')
      .catch(err => console.error('Error logging offline status:', err));
    
    // Clear any pending sync operations
    if (syncTimeout) {
      window.clearTimeout(syncTimeout);
      syncTimeout = null;
    }
  });
}

// Initialize all service worker functionality
export function initServiceWorkers() {
  registerServiceWorker();
  listenForSWMessages();
  registerBackgroundSync();
  setupOnlineListener();
}
