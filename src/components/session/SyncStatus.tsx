
import React from 'react';
import { useSyncStatusMonitor } from '@/hooks/session/useSyncStatusMonitor';
import { useSyncOperations } from '@/hooks/session/useSyncOperations';
import SyncStatusDisplay from './SyncStatusDisplay';

const SyncStatus = () => {
  const {
    status,
    isSyncing,
    setIsSyncing,
    totalUnsynced,
    totalItems,
    syncProgress,
    refreshStatus
  } = useSyncStatusMonitor();

  const { handleManualSync } = useSyncOperations({
    isSyncing,
    setIsSyncing,
    refreshStatus
  });

  return (
    <SyncStatusDisplay
      status={status}
      isSyncing={isSyncing}
      totalUnsynced={totalUnsynced}
      totalItems={totalItems}
      syncProgress={syncProgress}
      onManualSync={handleManualSync}
    />
  );
};

export default SyncStatus;
