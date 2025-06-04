
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

// Track sync operations to prevent duplicate processing
const processedSyncIds = new Set();

// Enhanced listener for service worker messages with timeouts and deduplication
export function listenForSWMessages() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'SYNC_SESSIONS') {
        // Check if we've already processed this sync ID
        const syncId = event.data.syncId || 'unknown';
        if (processedSyncIds.has(syncId)) {
          console.log(`Already processed sync request with ID: ${syncId}, skipping`);
          return;
        }
        
        // Add to processed IDs set with expiration (clear after 5 minutes)
        processedSyncIds.add(syncId);
        setTimeout(() => {
          processedSyncIds.delete(syncId);
        }, 5 * 60 * 1000);
        
        try {
          console.log('Received sync request from service worker:', event.data);
          // Import dynamically to avoid circular dependencies
          const { syncOfflineSessions, getSyncStatus } = await import('./lib/offlineDB');
          
          // Check if there's anything to sync
          const status = await getSyncStatus();
          if (status.sessionsUnsynced === 0 && status.interviewsUnsynced === 0) {
            console.log('No unsynced items found, skipping sync operation');
            
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                const activeWorker = registration.active;
                if (activeWorker) {
                  activeWorker.postMessage({
                    type: 'SYNC_COMPLETE',
                    timestamp: new Date().toISOString()
                  });
                }
              });
            }
            
            return;
          }
          
          // Use AbortController to allow timeout
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 4 * 60 * 1000); // 4 minute timeout
          
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
            
            // Notify service worker that sync is complete
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                const activeWorker = registration.active;
                if (activeWorker) {
                  activeWorker.postMessage({
                    type: 'SYNC_COMPLETE',
                    timestamp: new Date().toISOString(),
                    syncId: syncId
                  });
                }
              });
            }
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

// Request sync immediately with unique ID
export function requestSync() {
  if ('serviceWorker' in navigator) {
    const syncId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({ 
        type: 'SYNC_NOW',
        syncId: syncId
      });
    });
    
    return syncId;
  }
  return null;
}

// Enhanced background sync registration with retry logic
export function registerBackgroundSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Register periodic sync if available (Chrome origin trial)
      if ('periodicSync' in registration) {
        const periodicSync = registration.periodicSync as unknown as {
          register: (options: { tag: string; minInterval: number }) => Promise<void>;
          getTags: () => Promise<string[]>;
          unregister: (tag: string) => Promise<void>;
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
          
          // Try to register a retry sync
          setTimeout(() => {
            if ('sync' in registration) {
              const sync = registration.sync as unknown as {
                register: (tag: string) => Promise<void>;
              };
              sync.register('sync-sessions-retry').catch(error => {
                console.log('Background sync retry failed to register:', error);
              });
            }
          }, 60000);
        });
      }
    });
  }
}

// Trigger manual sync when online with debounce and backoff
let syncTimeout: number | null = null;
let syncAttempts = 0;
const MAX_SYNC_ATTEMPTS = 5;

export function setupOnlineListener() {
  window.addEventListener('online', () => {
    // Reset attempts counter when we come back online
    syncAttempts = 0;
    
    // Debounce to prevent multiple syncs when the connection is unstable
    if (syncTimeout) {
      window.clearTimeout(syncTimeout);
    }
    
    const attemptSync = () => {
      if (syncAttempts >= MAX_SYNC_ATTEMPTS) {
        console.log(`Maximum sync attempts (${MAX_SYNC_ATTEMPTS}) reached, stopping automatic retries`);
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
            
            sync.register('sync-sessions').catch(async error => {
              console.log('Background sync failed to register:', error);
              
              // Fall back to manual sync if background sync fails
              try {
                const { syncOfflineSessions, getSyncStatus } = await import('./lib/offlineDB');
                const status = await getSyncStatus();
                
                if (status.sessionsUnsynced > 0 || status.interviewsUnsynced > 0) {
                  await syncOfflineSessions();
                }
              } catch (err) {
                console.error('Manual sync fallback failed:', err);
                
                // If we still have unsynced items, try again with exponential backoff
                const { getUnsyncedSessionsCount, getUnsyncedInterviewsCount } = await import('./lib/offlineDB');
                const unsyncedSessions = await getUnsyncedSessionsCount();
                const unsyncedInterviews = await getUnsyncedInterviewsCount();
                
                if (unsyncedSessions > 0 || unsyncedInterviews > 0) {
                  const backoffDelay = Math.min(30000, Math.pow(2, syncAttempts) * 1000);
                  console.log(`Scheduling retry #${syncAttempts+1} in ${backoffDelay/1000} seconds`);
                  
                  syncTimeout = window.setTimeout(() => {
                    attemptSync();
                  }, backoffDelay);
                }
              }
            });
          } else {
            // Fall back to manual sync if background sync is not supported
            import('./lib/offlineDB').then(async ({ syncOfflineSessions, getSyncStatus }) => {
              const status = await getSyncStatus();
              if (status.sessionsUnsynced > 0 || status.interviewsUnsynced > 0) {
                await syncOfflineSessions();
              }
            }).catch(err => {
              console.error('Manual sync failed:', err);
            });
          }
        });
      }
    };
    
    syncTimeout = window.setTimeout(() => {
      attemptSync();
    }, 2000); // Wait 2 seconds after coming online before syncing
  });
}

// Initialize all service worker functionality
export function initServiceWorkers() {
  registerServiceWorker();
  listenForSWMessages();
  registerBackgroundSync();
  setupOnlineListener();
}
