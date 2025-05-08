import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { getCurrentLocation } from "@/lib/utils";
import { isOnline, saveOfflineInterview } from "@/lib/offlineDB";

/**
 * Hook for starting interviews - optimized for mobile performance
 */
export const useInterviewStart = (
  sessionId: string | null,
  setActiveInterview: (interview: Interview | null) => void,
  setIsInterviewLoading: (isLoading: boolean) => void,
  offlineSessionId: number | null = null,
  setActiveOfflineInterviewId?: (id: number | null) => void
) => {
  const { toast } = useToast();

  const startInterview = useCallback(async (projectId?: string) => {
    if (!sessionId && offlineSessionId === null) {
      toast({
        title: "Error",
        description: "No active session to attach an interview to",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsInterviewLoading(true);
      
      // Defer getting location to improve performance - get it in background
      let currentLocationPromise = getCurrentLocation();
      
      // Check if we're offline and have an offline session
      if (offlineSessionId !== null) {
        // Save interview to offline storage
        const candidateName = "New interview";
        const now = new Date().toISOString();
        
        const id = await saveOfflineInterview(
          offlineSessionId,
          candidateName,
          projectId || null,
          now,
          currentLocation
        );
        
        if (setActiveOfflineInterviewId) {
          setActiveOfflineInterviewId(id);
        }
        
        // Create a pseudo-interview to maintain compatibility with the UI
        const offlineInterview: Interview = {
          id: `offline-${id}`,
          session_id: `offline-${offlineSessionId}`,
          candidate_name: candidateName,
          start_time: now,
          is_active: true
        };
        
        if (currentLocation) {
          offlineInterview.start_latitude = currentLocation.latitude;
          offlineInterview.start_longitude = currentLocation.longitude;
          offlineInterview.start_address = currentLocation.address;
        }
        
        setActiveInterview(offlineInterview);
        
        toast({
          title: "Interview Started",
          description: isOnline() ? "" : "Interview has been saved locally and will sync when you're online",
        });
        
        setIsInterviewLoading(false);
        return;
      }
      
      // If we're online, continue with the normal flow
      if (!sessionId) {
        throw new Error("No session ID available");
      }
      
      // Get the session's project_id if not provided - do this in parallel with location fetch
      let interviewProjectIdPromise;
      if (!projectId) {
        interviewProjectIdPromise = supabase
          .from('sessions')
          .select('project_id')
          .eq('id', sessionId)
          .single()
          .then(({ data, error }) => {
            if (error) throw error;
            return data?.project_id;
          });
      } else {
        interviewProjectIdPromise = Promise.resolve(projectId);
      }
      
      // Wait for both operations in parallel
      const [currentLocation, interviewProjectId] = await Promise.all([
        currentLocationPromise,
        interviewProjectIdPromise
      ]);
      
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
            candidate_name: "New interview"
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
  }, [sessionId, offlineSessionId, setActiveInterview, setIsInterviewLoading, toast, setActiveOfflineInterviewId]);

  return { startInterview };
};
