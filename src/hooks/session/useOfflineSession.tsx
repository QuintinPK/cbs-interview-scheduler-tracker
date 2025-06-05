
import { useCallback } from "react";
import { Session, Location } from "@/types";
import { useToast } from "../use-toast";
import { 
  isOnline,
  saveOfflineSession,
  updateOfflineSession,
  getInterviewsForOfflineSession,
} from "@/lib/offlineDB";

interface UseOfflineSessionProps {
  interviewerCode: string;
  offlineSessionId: number | null;
  setOfflineSessionId: (id: number | null) => void;
  updateSessionState: (session: Session) => void;
  resetSessionState: () => void;
}

export const useOfflineSession = ({
  interviewerCode,
  offlineSessionId,
  setOfflineSessionId,
  updateSessionState,
  resetSessionState
}: UseOfflineSessionProps) => {
  const { toast } = useToast();

  // Function to start a new offline session
  const startOfflineSession = useCallback(async (
    interviewerId: string,
    projectId: string | null,
    locationData?: Location
  ): Promise<Session | null> => {
    if (isOnline()) {
      return null; // Only handle offline sessions
    }

    try {
      const now = new Date().toISOString();
      const id = await saveOfflineSession(
        interviewerCode,
        projectId,
        now,
        locationData
      );
      
      setOfflineSessionId(id);
      
      // Create a pseudo-session object to maintain compatibility
      const offlineSession: Session = {
        id: `offline-${id}`,
        interviewer_id: interviewerId,
        project_id: projectId,
        start_time: now,
        is_active: true,
        created_at: now
      };
      
      if (locationData) {
        offlineSession.start_latitude = locationData.latitude;
        offlineSession.start_longitude = locationData.longitude;
        offlineSession.start_address = locationData.address;
      }
      
      // Store the session in state and localStorage
      updateSessionState(offlineSession);
      
      toast({
        title: "Offline Mode",
        description: "Session started locally. It will sync when you're back online.",
      });
      
      return offlineSession;
    } catch (error) {
      console.error("Error starting offline session:", error);
      throw error;
    }
  }, [interviewerCode, setOfflineSessionId, updateSessionState, toast]);

  // Function to end an offline session
  const endOfflineSession = useCallback(async (): Promise<boolean> => {
    if (offlineSessionId === null) {
      return false;
    }

    try {
      // Check if all interviews are completed (have results)
      const interviews = await getInterviewsForOfflineSession(offlineSessionId);
      const hasUnfinishedInterviews = interviews.some(i => i.result === null);
      
      if (hasUnfinishedInterviews) {
        toast({
          title: "Error",
          description: "Please complete all interviews before ending your session",
          variant: "destructive",
        });
        return false;
      }
      
      await updateOfflineSession(
        offlineSessionId,
        new Date().toISOString(),
        undefined
      );
      
      resetSessionState();
      return true;
    } catch (error) {
      console.error("Error ending offline session:", error);
      toast({
        title: "Error",
        description: "Could not end session",
        variant: "destructive",
      });
      return false;
    }
  }, [offlineSessionId, resetSessionState, toast]);

  return {
    startOfflineSession,
    endOfflineSession
  };
};
