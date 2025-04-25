
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogOut, Wifi, WifiOff } from "lucide-react";
import { useOffline } from "@/contexts/OfflineContext";

interface InterviewerCodeInputProps {
  interviewerCode: string;
  setInterviewerCode: (code: string) => void;
  isPrimaryUser: boolean;
  isRunning: boolean;
  loading: boolean;
  switchUser: () => void;
  verifyInterviewerCode?: (code: string) => Promise<boolean>;
  onVerify?: () => void;
}

const InterviewerCodeInput: React.FC<InterviewerCodeInputProps> = ({
  interviewerCode,
  setInterviewerCode,
  isPrimaryUser,
  isRunning,
  loading,
  switchUser,
  verifyInterviewerCode,
  onVerify
}) => {
  const { isOnline } = useOffline();
  const [verifying, setVerifying] = React.useState(false);
  const [verified, setVerified] = React.useState(false);

  const handleVerify = async () => {
    if (!verifyInterviewerCode || !interviewerCode) return;
    
    try {
      setVerifying(true);
      const isValid = await verifyInterviewerCode(interviewerCode);
      
      if (isValid) {
        setVerified(true);
        if (onVerify) onVerify();
      } else {
        setVerified(false);
      }
    } catch (error) {
      console.error("Error verifying interviewer code:", error);
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-2">
      {isPrimaryUser && !isRunning ? (
        <div className="flex justify-between items-center">
          <div>
            <Label htmlFor="interviewer-code">Interviewer Code</Label>
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
          </div>
          <div className="flex items-center gap-1 text-sm">
            {isOnline ? (
              <span className="text-green-500 flex items-center gap-1">
                <Wifi className="h-4 w-4" /> Online
              </span>
            ) : (
              <span className="text-amber-500 flex items-center gap-1">
                <WifiOff className="h-4 w-4" /> Offline
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between">
            <Label htmlFor="interviewer-code">Interviewer Code</Label>
            <div className="text-sm">
              {isOnline ? (
                <span className="text-green-500 flex items-center gap-1">
                  <Wifi className="h-4 w-4" /> Online
                </span>
              ) : (
                <span className="text-amber-500 flex items-center gap-1">
                  <WifiOff className="h-4 w-4" /> Offline
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              id="interviewer-code"
              placeholder="Enter your code"
              value={interviewerCode}
              onChange={(e) => {
                setInterviewerCode(e.target.value);
                setVerified(false);
              }}
              className="text-lg"
              disabled={loading || isRunning || verifying}
            />
            {verifyInterviewerCode && !verified && !isRunning && (
              <Button
                onClick={handleVerify}
                disabled={loading || !interviewerCode || verifying}
                className="whitespace-nowrap"
              >
                {verifying ? "Verifying..." : "Verify Code"}
              </Button>
            )}
          </div>
          {verified && (
            <p className="text-sm text-green-600">Interviewer code verified successfully!</p>
          )}
        </>
      )}
    </div>
  );
};

export default InterviewerCodeInput;
