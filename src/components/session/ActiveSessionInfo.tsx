
import React from "react";
import { Location } from "@/types";

interface ActiveSessionInfoProps {
  isRunning: boolean;
  startTime: string | null;
  startLocation: Location | undefined;
}

const ActiveSessionInfo: React.FC<ActiveSessionInfoProps> = ({
  isRunning,
  startTime,
  startLocation
}) => {
  if (!isRunning) return null;
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="font-medium text-cbs">Session Active</p>
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
