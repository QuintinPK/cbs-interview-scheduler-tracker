
import React from "react";
import { Location } from "@/types";
import { WifiOff } from "lucide-react";

interface ActiveSessionInfoProps {
  isRunning: boolean;
  startTime: string | null;
  startLocation: Location | undefined;
  isOffline?: boolean;
}

const ActiveSessionInfo: React.FC<ActiveSessionInfoProps> = ({
  isRunning,
  startTime,
  startLocation,
  isOffline = false
}) => {
  if (!isRunning) return null;
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <p className="font-medium text-cbs">Session Active</p>
        {isOffline && (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">
        Started at: {startTime ? new Date(startTime).toLocaleTimeString() : 'Unknown'}
      </p>
      {startLocation && (
        <p className="text-sm text-gray-600">
          Location: {startLocation.latitude.toFixed(4)}, {startLocation.longitude.toFixed(4)}
        </p>
      )}
    </div>
  );
};

export default ActiveSessionInfo;
