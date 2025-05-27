
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";

/**
 * Hook for managing interview state
 */
export const useInterviewState = (sessionId: string | null) => {
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);

  // Fetch active interview for session
  const fetchActiveInterview = useCallback(async () => {
    if (!sessionId || sessionId.startsWith('temp-') || sessionId.startsWith('offline-')) return;
    
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (error && error.message.indexOf('single row') === -1) {
        throw error;
      }

      if (data) {
        // Transform the data to match our Interview interface
        const interview: Interview = {
          id: data.id,
          session_id: data.session_id,
          project_id: data.project_id,
          start_time: data.start_time,
          end_time: data.end_time,
          start_latitude: data.start_latitude,
          start_longitude: data.start_longitude,
          start_address: data.start_address,
          end_latitude: data.end_latitude,
          end_longitude: data.end_longitude,
          end_address: data.end_address,
          result: data.result as 'response' | 'non-response' | undefined,
          is_active: data.is_active,
          created_at: data.created_at,
          candidate_name: data.candidate_name
        };
        
        setActiveInterview(interview);
      } else {
        setActiveInterview(null);
      }
    } catch (error) {
      console.error("Error fetching active interview:", error);
      setActiveInterview(null);
    }
  }, [sessionId]);

  // Fetch active interview when session changes
  useEffect(() => {
    fetchActiveInterview();
  }, [fetchActiveInterview]);

  return {
    activeInterview,
    setActiveInterview,
    isInterviewLoading,
    setIsInterviewLoading,
    showResultDialog,
    setShowResultDialog,
    fetchActiveInterview
  };
};
