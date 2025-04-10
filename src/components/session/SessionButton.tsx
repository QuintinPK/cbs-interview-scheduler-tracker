
import React from "react";
import { Play, Square } from "lucide-react";

interface SessionButtonProps {
  isRunning: boolean;
  loading: boolean;
  interviewerCode: string;
  onClick: () => void;
  disabled?: boolean;
}

const SessionButton: React.FC<SessionButtonProps> = ({
  isRunning,
  loading,
  interviewerCode,
  onClick,
  disabled = false
}) => {
  return (
    <div className="flex justify-center pt-4">
      <button
        onClick={onClick}
        disabled={loading || !interviewerCode || disabled}
        className={`start-stop-button w-24 h-24 rounded-full flex items-center justify-center ${
          isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
        } ${(loading || !interviewerCode || disabled) ? "opacity-50 cursor-not-allowed" : ""} text-white transition-colors`}
      >
        {loading ? (
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
        ) : isRunning ? (
          <Square className="h-10 w-10" />
        ) : (
          <Play className="h-10 w-10 ml-1" />
        )}
      </button>
    </div>
  );
};

export default SessionButton;
