
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { differenceInSeconds, intervalToDuration } from "date-fns";

interface CurrentSessionTimeProps {
  startTime: string | null;
  isRunning: boolean;
}

const CurrentSessionTime: React.FC<CurrentSessionTimeProps> = ({ startTime, isRunning }) => {
  const [elapsedTime, setElapsedTime] = useState<string>("0h 0m 0s");
  
  useEffect(() => {
    if (!isRunning || !startTime) {
      setElapsedTime("0h 0m 0s");
      return;
    }
    
    // Initial calculation
    calculateElapsedTime();
    
    // Update every second when running
    const intervalId = setInterval(() => {
      calculateElapsedTime();
    }, 1000);
    
    return () => clearInterval(intervalId);
    
    function calculateElapsedTime() {
      try {
        const start = new Date(startTime);
        const now = new Date();
        const totalSeconds = differenceInSeconds(now, start);
        
        // Format the duration
        const duration = intervalToDuration({ start: 0, end: totalSeconds * 1000 });
        const hours = duration.hours! + (duration.days || 0) * 24;
        const formattedDuration = `${hours}h ${duration.minutes}m ${duration.seconds}s`;
        setElapsedTime(formattedDuration);
      } catch (error) {
        console.error("Error calculating elapsed time:", error);
        setElapsedTime("Error");
      }
    }
  }, [startTime, isRunning]);
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-5 w-5 text-cbs" />
        <p className="font-medium text-cbs">Current Session Time</p>
      </div>
      <p className="text-xl font-bold text-gray-800">{elapsedTime}</p>
    </div>
  );
};

export default CurrentSessionTime;
