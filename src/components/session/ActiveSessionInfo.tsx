
import React from "react";
import { formatDateTime } from "@/lib/utils";
import { Clock, MapPin, Calendar, Building } from "lucide-react";
import { Location, Island } from "@/types";

interface ActiveSessionInfoProps {
  isRunning: boolean;
  startTime: string | null;
  startLocation: Location | undefined;
  projectName?: string;
  island?: Island | null;
}

const ActiveSessionInfo: React.FC<ActiveSessionInfoProps> = ({
  isRunning,
  startTime,
  startLocation,
  projectName,
  island
}) => {
  if (!isRunning) return null;

  return (
    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
      <h3 className="font-medium text-gray-700 flex items-center">
        <Clock className="h-4 w-4 mr-1 text-gray-500" />
        Active Session
      </h3>
      
      {projectName && (
        <div className="text-sm">
          <span className="text-gray-500 flex items-center">
            <Building className="h-3 w-3 mr-1" />
            Project: <span className="ml-1 font-medium">{projectName}</span>
          </span>
        </div>
      )}
      
      {island && (
        <div className="text-sm">
          <span className="text-gray-500 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            Island: <span className="ml-1 font-medium">{island}</span>
          </span>
        </div>
      )}
      
      {startTime && (
        <div className="text-sm">
          <span className="text-gray-500 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Started at: <span className="ml-1 font-medium">{formatDateTime(startTime)}</span>
          </span>
        </div>
      )}
      
      {startLocation && (
        <div className="text-sm">
          <span className="text-gray-500 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            Location: 
            <span className="ml-1 font-medium truncate">
              {startLocation.address || `${startLocation.latitude.toFixed(4)}, ${startLocation.longitude.toFixed(4)}`}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default ActiveSessionInfo;
