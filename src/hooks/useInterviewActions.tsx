
import { useState, useEffect } from "react";
import { useInterviewStart } from "./interview/useInterviewStart";
import { useInterviewStop } from "./interview/useInterviewStop";
import { isOnline, getOfflineInterview, getInterviewsForOfflineSession } from "@/lib/offlineDB";
import { Interview } from "@/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Main hook that combines all interview-related hooks
 */
export const useInterviewActions = (sessionId: string | null, offlineSessionId: number | null = null) => {
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [activeOfflineInterviewId, setActiveOfflineInterviewId] = useState<number | null>(null);
  const [offlineInterviews, setOfflineInterviews] = useState<any[]>([]);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  // Fetch active interview for online sessions
  const fetchActiveInterview = async () => {
    if (!sessionId || offlineSessionId !== null) return;
    
    try {
      setIsInterviewLoading(true);
      
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching active interview:', error);
        return;
      }
      
      setActiveInterview(data);
    } catch (error) {
      console.error('Error fetching active interview:', error);
    } finally {
      setIsInterviewLoading(false);
    }
  };

  // Interview result handlers
  const setInterviewResult = async (result: string) => {
    if (!activeInterview) return;
    
    try {
      setIsInterviewLoading(true);
      
      if (activeOfflineInterviewId !== null) {
        // Handle offline interview result
        // This would need offline DB implementation
        console.log('Setting offline interview result:', result);
      } else {
        // Handle online interview result
        const { error } = await supabase
          .from('interviews')
          .update({ result, is_active: false })
          .eq('id', activeInterview.id);
          
        if (error) {
          console.error('Error setting interview result:', error);
          return;
        }
      }
      
      setActiveInterview(null);
      setShowResultDialog(false);
      setActiveOfflineInterviewId(null);
    } catch (error) {
      console.error('Error setting interview result:', error);
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const cancelResultDialog = () => {
    setShowResultDialog(false);
  };
  
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
  }, [offlineSessionId]);

  // Fetch active interview on mount for online sessions
  useEffect(() => {
    if (sessionId && offlineSessionId === null) {
      fetchActiveInterview();
    }
  }, [sessionId, offlineSessionId]);
  
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
