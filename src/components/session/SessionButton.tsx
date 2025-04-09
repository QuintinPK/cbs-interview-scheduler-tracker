
import React from "react";
import { Play, Square, WifiOff } from "lucide-react";

interface SessionButtonProps {
  isRunning: boolean;
  loading: boolean;
  interviewerCode: string;
  onClick: () => void;
  isOffline?: boolean;
}

const SessionButton: React.FC<SessionButtonProps> = ({
  isRunning,
  loading,
  interviewerCode,
  onClick,
  isOffline = false
}) => {
  return (
    <div className="flex flex-col items-center pt-4">
      <button
        onClick={onClick}
        disabled={loading || !interviewerCode}
        className={`start-stop-button w-24 h-24 rounded-full flex items-center justify-center ${
          isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
        } ${(loading || !interviewerCode) ? "opacity-50 cursor-not-allowed" : ""} text-white transition-colors relative`}
      >
        {loading ? (
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
        ) : isRunning ? (
          <Square className="h-10 w-10" />
        ) : (
          <Play className="h-10 w-10 ml-1" />
        )}
        
        {isOffline && (
          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full">
            <WifiOff className="h-4 w-4" />
          </span>
        )}
      </button>
      
      <p className="mt-4 text-sm text-center text-gray-600">
        {isRunning ? "Stop Session" : "Start Session"}
        {isOffline && " (Offline)"}
      </p>
    </div>
  );
};

export default SessionButton;
