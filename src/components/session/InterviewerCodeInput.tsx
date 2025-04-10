
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
  return (
    <div className="space-y-2">
      <Label htmlFor="interviewer-code">Interviewer Code</Label>
      
      {isPrimaryUser && !isRunning ? (
        <div className="flex items-center gap-2">
          <p className="text-lg font-medium">{interviewerCode}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={switchUser}
            className="flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            <span>Switch User</span>
          </Button>
        </div>
      ) : (
        <Input
          id="interviewer-code"
          placeholder="Enter your code"
          value={interviewerCode}
          onChange={(e) => setInterviewerCode(e.target.value)}
          className="text-lg"
          disabled={loading || isRunning}
        />
      )}
    </div>
  );
};

export default InterviewerCodeInput;
