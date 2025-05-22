// New file: src/lib/connectivity.ts
import { isOnline } from './offlineDB';

export const withConnectivityHandling = async <T>(
  onlineOperation: () => Promise<T>,
  offlineOperation: () => Promise<T>,
  options: {
    forceOffline?: boolean;
    onTransition?: (wasOnline: boolean, isNowOnline: boolean) => void;
  } = {}
): Promise<T> => {
  // Check initial connectivity
  const initiallyOnline = isOnline();
  
  try {
    // If we're forcing offline mode or actually offline, use offline operation
    if (options.forceOffline || !initiallyOnline) {
      return await offlineOperation();
    }
    
    // Try online operation
    return await onlineOperation();
  } catch (error) {
    // Check if connectivity changed during operation
    const nowOnline = isOnline();
    
    if (initiallyOnline && !nowOnline) {
      // We lost connectivity during the operation
      console.log("Connectivity lost during operation, falling back to offline mode");
      
      if (options.onTransition) {
        options.onTransition(initiallyOnline, nowOnline);
      }
      
      // Fall back to offline operation
      return await offlineOperation();
    }
    
    // If connectivity didn't change or we're still online, rethrow
    throw error;
  }
};
