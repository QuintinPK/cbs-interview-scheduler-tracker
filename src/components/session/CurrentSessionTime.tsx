
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";

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
        
        if (isNaN(totalSeconds)) {
          console.error("Invalid time calculation", { startTime, now });
          setElapsedTime("0h 0m 0s");
          return;
        }
        
        // Calculate hours, minutes, seconds manually to avoid NaN errors
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        
        const formattedDuration = `${hours}h ${minutes}m ${seconds}s`;
        setElapsedTime(formattedDuration);
      } catch (error) {
        console.error("Error calculating elapsed time:", error);
        setElapsedTime("0h 0m 0s");
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
