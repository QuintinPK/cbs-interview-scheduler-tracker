
import React from 'react';

interface SyncDetailsSectionProps {
  status: any;
  showDetails: boolean;
}

const SyncDetailsSection: React.FC<SyncDetailsSectionProps> = ({
  status,
  showDetails
}) => {
  if (!showDetails) return null;

  return (
    <div className="mt-3 pt-3 border-t text-xs space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <div>Sessions pending:</div>
        <div className="text-right">{status.sessionsUnsynced} / {status.sessionsTotal}</div>
        
        <div>Interviews pending:</div>
        <div className="text-right">{status.interviewsUnsynced} / {status.interviewsTotal}</div>
        
        <div>Operations in progress:</div>
        <div className="text-right">{status.sessionsInProgress + status.interviewsInProgress}</div>
      </div>
      
      {status.currentLock?.isLocked === 1 && (
        <div className="text-xs text-amber-600 mt-2">
          <p>Lock active: {status.currentLock.lockedBy}</p>
          <p>Expires: {new Date(status.currentLock.expiresAt).toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default SyncDetailsSection;
