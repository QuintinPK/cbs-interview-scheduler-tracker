
import React from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterviewButtonProps {
  isInterviewActive: boolean;
  loading: boolean;
  onClick: () => void;
  disabled: boolean;
}

const InterviewButton: React.FC<InterviewButtonProps> = ({
  isInterviewActive,
  loading,
  onClick,
  disabled
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-6 ${
        isInterviewActive ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"
      } text-white flex items-center justify-center gap-2`}
    >
      {loading ? (
        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
      ) : isInterviewActive ? (
        <>
          <Square className="h-5 w-5" />
          <span>Stop Interview</span>
        </>
      ) : (
        <>
          <Play className="h-5 w-5 ml-1" />
          <span>Start Interview</span>
        </>
      )}
    </Button>
  );
};

export default InterviewButton;
