
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface SyncProgressSectionProps {
  syncProgress: number;
  totalUnsynced: number;
  isSyncing: boolean;
}

const SyncProgressSection: React.FC<SyncProgressSectionProps> = ({
  syncProgress,
  totalUnsynced,
  isSyncing
}) => {
  return (
    <div>
      <Progress value={syncProgress} className="h-2 mb-2" />
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {totalUnsynced > 0 ? (
              <>
                <span className="text-amber-600">{totalUnsynced}</span> {totalUnsynced === 1 ? 'item' : 'items'} need to sync
              </>
            ) : isSyncing ? (
              <span className="text-blue-600">Syncing in progress...</span>
            ) : (
              <span className="text-green-600">All data synced</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SyncProgressSection;
