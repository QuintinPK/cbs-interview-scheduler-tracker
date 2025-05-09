
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogOut, User, LogIn } from "lucide-react";

interface InterviewerCodeInputProps {
  interviewerCode: string;
  setInterviewerCode: (code: string) => void;
  isPrimaryUser: boolean;
  isRunning: boolean;
  loading: boolean;
  switchUser: () => void;
  onLogin?: () => void;
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
  // Debug logging
  useEffect(() => {
    console.log("InterviewerCodeInput - isPrimaryUser:", isPrimaryUser);
    console.log("InterviewerCodeInput - interviewerCode:", interviewerCode);
    console.log("InterviewerCodeInput - onLogin prop available:", !!onLogin);
  }, [isPrimaryUser, interviewerCode, onLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin && interviewerCode.trim()) {
      console.log("Login form submitted, calling onLogin");
      onLogin();
    }
  };

  return (
    <div className="space-y-2">
      {/* LOGGED IN STATE - Show when isPrimaryUser is true */}
      {isPrimaryUser && (
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <Label htmlFor="interviewer-code">Interviewer Code</Label>
            <div className="flex items-center justify-between gap-2 mt-1 border p-2 rounded-md bg-muted/20">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-cbs" />
                <p className="text-lg font-medium">{interviewerCode}</p>
              </div>
            </div>
          </div>
          
          {/* Logout button - Always show when logged in */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={switchUser}
            disabled={loading}
            className="flex items-center gap-1 w-full bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        </div>
      )}
      
      {/* NOT LOGGED IN STATE - Show when isPrimaryUser is false */}
      {!isPrimaryUser && (
        <form onSubmit={handleSubmit}>
          <Label htmlFor="interviewer-code">Interviewer Code</Label>
          <div className="space-y-2">
            <Input
              id="interviewer-code"
              placeholder="Enter your code"
              value={interviewerCode}
              onChange={(e) => setInterviewerCode(e.target.value)}
              className="text-lg"
              disabled={loading || isRunning}
            />
            
            {/* Always show login button when code is entered */}
            {interviewerCode.trim() && (
              <Button 
                type="submit"
                disabled={!interviewerCode.trim() || loading || !onLogin}
                className="w-full"
                variant="default"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-b-transparent border-white"></div>
                    <span>Logging In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-1" />
                    <span>Log In</span>
                  </>
                )}
              </Button>
            )}
            
            <p className="text-xs text-muted-foreground">
              Enter your interviewer code to log in
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default InterviewerCodeInput;
