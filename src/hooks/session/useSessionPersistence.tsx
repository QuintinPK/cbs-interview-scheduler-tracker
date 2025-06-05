
import { useEffect, useCallback } from "react";
import { Session } from "@/types";
import { cacheInterviewer } from "@/lib/offlineDB";

interface UseSessionPersistenceProps {
  interviewerCode: string;
  isPrimaryUser: boolean;
  activeSession: Session | null;
  offlineSessionId: number | null;
  onLoadSavedData: (data: {
    session?: Session;
    code?: string;
    offlineId?: number;
  }) => void;
}

export const useSessionPersistence = ({
  interviewerCode,
  isPrimaryUser,
  activeSession,
  offlineSessionId,
  onLoadSavedData
}: UseSessionPersistenceProps) => {

  // Load saved data from localStorage on initial render
  const loadSavedData = useCallback(async () => {
    console.log("Loading saved data in useSessionPersistence");
    
    const savedSession = localStorage.getItem("active_session");
    const savedCode = localStorage.getItem("interviewerCode");
    
    const loadedData: any = {};
    
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        loadedData.session = sessionData;
        if (sessionData.offlineId) {
          loadedData.offlineId = sessionData.offlineId;
        }
      } catch (error) {
        console.error("Error parsing saved session:", error);
        localStorage.removeItem("active_session");
      }
    }
    
    if (savedCode) {
      console.log("Found saved interviewer code:", savedCode);
      loadedData.code = savedCode;
      await cacheInterviewer(savedCode);
    }
    
    if (Object.keys(loadedData).length > 0) {
      onLoadSavedData(loadedData);
    }
  }, [onLoadSavedData]);

  // Save interviewer code to localStorage when it changes
  useEffect(() => {
    const saveInterviewerCode = async () => {
      if (interviewerCode && isPrimaryUser) {
        localStorage.setItem("interviewerCode", interviewerCode);
        await cacheInterviewer(interviewerCode);
      } else if (!interviewerCode && isPrimaryUser) {
        localStorage.removeItem("interviewerCode");
      }
    };
    
    saveInterviewerCode();
  }, [interviewerCode, isPrimaryUser]);

  // Save active session to localStorage whenever it changes
  useEffect(() => {
    if (activeSession) {
      const sessionToSave = {
        ...activeSession,
        offlineId: offlineSessionId
      };
      localStorage.setItem("active_session", JSON.stringify(sessionToSave));
    } else {
      localStorage.removeItem("active_session");
    }
  }, [activeSession, offlineSessionId]);

  const clearStoredData = useCallback(() => {
    localStorage.removeItem("interviewerCode");
    localStorage.removeItem("active_session");
  }, []);

  return {
    loadSavedData,
    clearStoredData
  };
};
