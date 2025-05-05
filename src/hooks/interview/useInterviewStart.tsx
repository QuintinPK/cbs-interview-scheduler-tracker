
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { getCurrentLocation } from "@/lib/utils";

/**
 * Hook for starting interviews
 */
export const useInterviewStart = (
  sessionId: string | null,
  setActiveInterview: (interview: Interview | null) => void,
  setIsInterviewLoading: (isLoading: boolean) => void
) => {
  const { toast } = useToast();

  const startInterview = useCallback(async (projectId?: string) => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No active session to attach an interview to",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsInterviewLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      // Get the session's project_id if not provided
      let interviewProjectId = projectId;
      if (!interviewProjectId) {
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .select('project_id')
          .eq('id', sessionId)
          .single();
        
        if (sessionError) throw sessionError;
        interviewProjectId = session?.project_id;
      }
      
      const { data, error } = await supabase
        .from('interviews')
        .insert([
          {
            session_id: sessionId,
            project_id: interviewProjectId,
            start_latitude: currentLocation?.latitude || null,
            start_longitude: currentLocation?.longitude || null,
            start_address: currentLocation?.address || null,
            is_active: true,
            candidate_name: "New interview" // Now explicitly add candidate_name
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // With the DB update, candidate_name should now be present in the data
      const interview: Interview = {
        ...data,
        candidate_name: data.candidate_name
      };
      
      setActiveInterview(interview);
      
      toast({
        title: "Interview Started",
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        title: "Error",
        description: "Could not start interview",
        variant: "destructive",
      });
    } finally {
      setIsInterviewLoading(false);
    }
  }, [sessionId, setActiveInterview, setIsInterviewLoading, toast]);

  return { startInterview };
};
