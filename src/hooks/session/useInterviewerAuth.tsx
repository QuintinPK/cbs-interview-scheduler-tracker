
import { useState, useCallback, useRef } from "react";
import { useToast } from "../use-toast";
import { 
  getInterviewerByCode,
  cacheInterviewer,
} from "@/lib/offlineDB";

export const useInterviewerAuth = (initialCode: string = "") => {
  const { toast } = useToast();
  const validationInProgressRef = useRef(false);
  
  const [interviewerCode, setInterviewerCode] = useState<string>(initialCode);
  const [isPrimaryUser, setIsPrimaryUser] = useState(false);
  const [lastValidatedCode, setLastValidatedCode] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Validate the interviewer code explicitly when requested
  const validateInterviewerCode = useCallback(async () => {
    // Prevent multiple simultaneous validations
    if (validationInProgressRef.current) {
      return false;
    }
    
    validationInProgressRef.current = true;
    
    if (!interviewerCode.trim()) {
      validationInProgressRef.current = false;
      return false;
    }
    
    try {
      setLoading(true);
      
      // Validate interviewer code (online or offline)
      const interviewer = await getInterviewerByCode(interviewerCode);
      
      if (!interviewer) {
        // If we've previously validated this code, don't show an error
        if (interviewerCode !== lastValidatedCode) {
          toast({
            title: "Error",
            description: "Interviewer code not found",
            variant: "destructive",
          });
        }
        return false;
      }
      
      // Remember the last valid code and set as primary user
      setLastValidatedCode(interviewerCode);
      setIsPrimaryUser(true);
      console.log("Valid interviewer code found, setting isPrimaryUser to true");
      
      return true;
    } catch (error) {
      console.error("Error validating interviewer code:", error);
      toast({
        title: "Error",
        description: "Could not validate interviewer code",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
      validationInProgressRef.current = false;
    }
  }, [interviewerCode, lastValidatedCode, toast]);

  const switchUser = useCallback(() => {
    console.log("switchUser called - logging out");
    setInterviewerCode("");
    setIsPrimaryUser(false);
    setLastValidatedCode("");
  }, []);

  return {
    interviewerCode,
    setInterviewerCode,
    isPrimaryUser,
    setIsPrimaryUser,
    lastValidatedCode,
    setLastValidatedCode,
    loading,
    validateInterviewerCode,
    switchUser
  };
};
