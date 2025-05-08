
// Define types for the Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  sync?: SyncManager;
  periodicSync?: {
    register: (options: { tag: string; minInterval: number }) => Promise<void>;
  };
}

interface ServiceWorker {
  scriptURL: string;
  state: string;
}

// Extend the Navigator interface to include serviceWorker
interface Navigator {
  serviceWorker: {
    ready: Promise<ServiceWorkerRegistration>;
    controller: ServiceWorker | null;
    getRegistration(): Promise<ServiceWorkerRegistration | undefined>;
    register(scriptURL: string, options?: object): Promise<ServiceWorkerRegistration>;
  };
}
