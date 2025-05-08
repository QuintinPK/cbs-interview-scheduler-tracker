
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, WifiOff, Upload } from "lucide-react";

interface SessionButtonProps {
  isRunning: boolean;
  loading: boolean;
  interviewerCode: string;
  onClick: () => void;
  disabled: boolean;
  isOffline?: boolean;
  unsyncedCount?: number;
}

const SessionButton: React.FC<SessionButtonProps> = ({
  isRunning,
  loading,
  interviewerCode,
  onClick,
  disabled,
  isOffline = false,
  unsyncedCount = 0
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading || !interviewerCode.trim()}
      className={`w-full py-6 ${
        isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
      } text-white flex items-center justify-center gap-2 relative`}
    >
      {loading ? (
        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
      ) : isRunning ? (
        <>
          <Square className="h-5 w-5" />
          <span>End Session</span>
          {isOffline && <WifiOff className="h-4 w-4 ml-2" />}
        </>
      ) : (
        <>
          <Play className="h-5 w-5 ml-1" />
          <span>Start Session</span>
          {isOffline && <WifiOff className="h-4 w-4 ml-2" />}
        </>
      )}
      
      {!isOffline && unsyncedCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          <Upload className="h-3 w-3" />
        </div>
      )}
    </Button>
  );
};

export default SessionButton;
