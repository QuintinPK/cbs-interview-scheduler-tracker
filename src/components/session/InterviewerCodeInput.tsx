
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface InterviewerCodeInputProps {
  interviewerCode: string;
  setInterviewerCode: (code: string) => void;
  isPrimaryUser: boolean;
  isRunning: boolean;
  loading: boolean;
  switchUser: () => void;
}

const InterviewerCodeInput: React.FC<InterviewerCodeInputProps> = ({
  interviewerCode,
  setInterviewerCode,
  isPrimaryUser,
  isRunning,
  loading,
  switchUser
}) => {
  // Debug logging to check if isPrimaryUser is being set correctly
  useEffect(() => {
    console.log("InterviewerCodeInput - isPrimaryUser:", isPrimaryUser);
    console.log("InterviewerCodeInput - interviewerCode:", interviewerCode);
  }, [isPrimaryUser, interviewerCode]);

  return (
    <div className="space-y-2">
      {interviewerCode && (
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
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={switchUser}
            className="flex items-center gap-1 w-full bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        </div>
      )}
      
      {!interviewerCode && (
        <>
          <Label htmlFor="interviewer-code">Interviewer Code</Label>
          <Input
            id="interviewer-code"
            placeholder="Enter your code"
            value={interviewerCode}
            onChange={(e) => setInterviewerCode(e.target.value)}
            className="text-lg"
            disabled={loading || isRunning}
          />
          
          <p className="text-xs text-muted-foreground mt-1">
            Enter your interviewer code to log in
          </p>
        </>
      )}
    </div>
  );
};

export default InterviewerCodeInput;
