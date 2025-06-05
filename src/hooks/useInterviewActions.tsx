
import { useInterviewState } from "./interview/useInterviewState";
import { useInterviewStart } from "./interview/useInterviewStart";
import { useInterviewStop } from "./interview/useInterviewStop";
import { useInterviewResult } from "./interview/useInterviewResult";
import { useState, useEffect } from "react";
import { isOnline, getOfflineInterview, getInterviewsForOfflineSession } from "@/lib/offlineDB";
import { Interview } from "@/types";

/**
 * Main hook that combines all interview-related hooks
 */
export const useInterviewActions = (sessionId: string | null, offlineSessionId: number | null = null) => {
  const [activeOfflineInterviewId, setActiveOfflineInterviewId] = useState<number | null>(null);
  const [offlineInterviews, setOfflineInterviews] = useState<any[]>([]);
  
  const {
    activeInterview,
    setActiveInterview,
    isInterviewLoading,
    setIsInterviewLoading,
    showResultDialog,
    setShowResultDialog,
    fetchActiveInterview
  } = useInterviewState(sessionId);
  
  const { startInterview } = useInterviewStart(
    sessionId,
    setActiveInterview,
    setIsInterviewLoading,
    offlineSessionId,
    setActiveOfflineInterviewId
  );
  
  const { stopInterview } = useInterviewStop(
    activeInterview,
    setShowResultDialog,
    setIsInterviewLoading,
    activeOfflineInterviewId
  );
  
  const { setInterviewResult, cancelResultDialog } = useInterviewResult(
    activeInterview,
    setActiveInterview,
    setShowResultDialog,
    setIsInterviewLoading,
    activeOfflineInterviewId,
    setActiveOfflineInterviewId
  );
  
  // Fetch offline interviews for this session if we're offline
  useEffect(() => {
    const fetchOfflineInterviews = async () => {
      if (offlineSessionId !== null) {
        const interviews = await getInterviewsForOfflineSession(offlineSessionId);
        setOfflineInterviews(interviews);
        
        // Check if there's an active offline interview
        const activeInterview = interviews.find(i => i.endTime === null || (i.endTime !== null && i.result === null));
        if (activeInterview) {
          setActiveOfflineInterviewId(activeInterview.id);
          
          // Create a pseudo Interview object to maintain compatibility
          const pseudoInterview: Interview = {
            id: `offline-${activeInterview.id}`,
            session_id: `offline-${offlineSessionId}`,
            start_time: activeInterview.startTime,
            is_active: true,
            candidate_name: activeInterview.candidateName
          };
          
          if (activeInterview.startLatitude) {
            pseudoInterview.start_latitude = activeInterview.startLatitude;
            pseudoInterview.start_longitude = activeInterview.startLongitude;
            pseudoInterview.start_address = activeInterview.startAddress;
          }
          
          if (activeInterview.endTime) {
            pseudoInterview.end_time = activeInterview.endTime;
            pseudoInterview.end_latitude = activeInterview.endLatitude;
            pseudoInterview.end_longitude = activeInterview.endLongitude;
            pseudoInterview.end_address = activeInterview.endAddress;
          }
          
          setActiveInterview(pseudoInterview);
        }
      }
    };
    
    if (!isOnline() && offlineSessionId !== null) {
      fetchOfflineInterviews();
    }
  }, [offlineSessionId, setActiveInterview]);
  
  return {
    activeInterview,
    isInterviewLoading,
    showResultDialog,
    startInterview,
    stopInterview,
    setInterviewResult,
    cancelResultDialog,
    fetchActiveInterview,
    offlineInterviews
  };
};
