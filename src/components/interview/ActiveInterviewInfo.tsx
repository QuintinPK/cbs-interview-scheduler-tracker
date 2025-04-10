
import React from "react";
import { Interview, Location } from "@/types";
import { Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface ActiveInterviewInfoProps {
  activeInterview: Interview | null;
  startLocation: Location | undefined;
}

const ActiveInterviewInfo: React.FC<ActiveInterviewInfoProps> = ({
  activeInterview,
  startLocation
}) => {
  if (!activeInterview) return null;
  
  const startTime = new Date(activeInterview.start_time);
  const now = new Date();
  const elapsedMilliseconds = now.getTime() - startTime.getTime();
  const elapsedMinutes = Math.floor(elapsedMilliseconds / (1000 * 60));
  
  return (
    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
      <div className="flex items-center">
        <Clock className="h-5 w-5 text-orange-500 mr-2" />
        <p className="font-medium text-orange-700">Interview in progress</p>
      </div>
      <p className="text-sm text-orange-600 mt-1">
        Started {formatTime(startTime)} ({elapsedMinutes} minutes ago)
      </p>
      {startLocation && (
        <p className="text-sm text-orange-600 mt-1">
          Location: {startLocation.latitude.toFixed(4)}, {startLocation.longitude.toFixed(4)}
        </p>
      )}
    </div>
  );
};

export default ActiveInterviewInfo;
