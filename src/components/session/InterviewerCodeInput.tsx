
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InterviewerCodeInputProps {
  interviewerCode: string;
  setInterviewerCode: (code: string) => void;
  isPrimaryUser: boolean;
  isRunning: boolean;
  loading: boolean;
  switchUser: () => void;
  onLogin?: () => Promise<boolean>;
}

const InterviewerCodeInput: React.FC<InterviewerCodeInputProps> = ({
  interviewerCode,
  setInterviewerCode,
  isPrimaryUser,
  isRunning,
  loading,
  switchUser,
  onLogin
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Log props for debugging
  useEffect(() => {
    console.log("InterviewerCodeInput - isPrimaryUser:", isPrimaryUser);
    console.log("InterviewerCodeInput - interviewerCode:", interviewerCode);
    console.log("InterviewerCodeInput - onLogin prop available:", !!onLogin);
  }, [isPrimaryUser, interviewerCode, onLogin]);

  const handleLogin = async () => {
    if (!onLogin) return;
    
    setIsLoggingIn(true);
    try {
      await onLogin();
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Time saver - handle Enter key press for login
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRunning && onLogin) {
      handleLogin();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <User className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Enter interviewer code"
          value={interviewerCode}
          onChange={(e) => setInterviewerCode(e.target.value)}
          disabled={isRunning || loading || isLoggingIn}
          onKeyDown={handleKeyPress}
          className="pl-10"
        />
      </div>
      
      {isPrimaryUser ? (
        <>
          {onLogin && !isRunning && interviewerCode.trim() ? (
            <Button
              onClick={handleLogin}
              disabled={loading || isLoggingIn || !interviewerCode.trim()}
              size="sm"
            >
              {isLoggingIn ? "Validating..." : "Login"}
            </Button>
          ) : null}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchUser}
                  disabled={isRunning}
                  className={isRunning ? "cursor-not-allowed opacity-50" : ""}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRunning ? 
                  "Cannot log out during active session" : 
                  "Switch to secondary user"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={switchUser}
          disabled={loading}
        >
          Switch
        </Button>
      )}
    </div>
  );
};

export default InterviewerCodeInput;
