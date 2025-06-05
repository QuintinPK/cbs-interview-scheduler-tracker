
import React from "react";
import { WifiOff, Upload } from "lucide-react";
import { isOnline } from "@/lib/offlineDB";

interface SessionHeaderProps {
  unsyncedCount: number;
  unsyncedInterviews: number;
  isSyncing: boolean;
  onManualSync: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  unsyncedCount,
  unsyncedInterviews,
  isSyncing,
  onManualSync
}) => {
  const totalUnsynced = unsyncedCount + unsyncedInterviews;

  return (
    <>
      {/* Offline indicator */}
      {!isOnline() && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
          <p className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" />
            You are currently offline. Sessions and interviews will be saved locally and synchronized when you're back online.
          </p>
        </div>
      )}
      
      {/* Unsynced data indicator */}
      {isOnline() && totalUnsynced > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
          <p className="flex items-center justify-between">
            <span>
              {unsyncedCount > 0 && `${unsyncedCount} offline ${unsyncedCount === 1 ? 'session' : 'sessions'}`}
              {unsyncedCount > 0 && unsyncedInterviews > 0 && ' and '}
              {unsyncedInterviews > 0 && `${unsyncedInterviews} ${unsyncedInterviews === 1 ? 'interview' : 'interviews'}`}
              {' waiting to be synchronized'}
            </span>
            <button 
              onClick={onManualSync}
              disabled={isSyncing}
              className={`ml-2 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </p>
        </div>
      )}
    </>
  );
};

export default SessionHeader;
