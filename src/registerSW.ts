
import { getSyncManager } from '@/lib/sync';

// Initialize sync system
export async function initializeSync(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_SESSIONS') {
          console.log('Received sync request from service worker');
          const syncManager = getSyncManager();
          syncManager.attemptSync(true);
        }
      });
    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  }
}

// Request sync from service worker
export function requestSync(): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SYNC_REQUEST',
      timestamp: new Date().toISOString()
    });
  } else {
    // Fallback to direct sync if service worker is not available
    const syncManager = getSyncManager();
    syncManager.attemptSync(true);
  }
}

// Handle online event
window.addEventListener('online', () => {
  console.log('Browser went online, attempting sync');
  const syncManager = getSyncManager();
  syncManager.attemptSync(true);
});

// Handle background sync requests
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'BACKGROUND_SYNC') {
      console.log('Background sync requested');
      const syncManager = getSyncManager();
      syncManager.attemptSync(true);
    }
  });
}
