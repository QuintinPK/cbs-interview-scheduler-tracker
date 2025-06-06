
import { useCallback, useRef } from "react";
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
  const operationInProgressRef = useRef(false);

  const startInterview = useCallback(async (projectId?: string) => {
    // Prevent multiple simultaneous calls
    if (operationInProgressRef.current) {
      return;
    }
    
    operationInProgressRef.current = true;
    
    if (!sessionId && offlineSessionId === null) {
      toast({
        title: "Error",
        description: "No active session to attach an interview to",
        variant: "destructive",
      });
      operationInProgressRef.current = false;
      return;
    }
    
    // Immediately update UI to show activity
    setIsInterviewLoading(true);
    
    try {
      // Start optimistic UI update for better perceived performance
      const optimisticId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      const candidateName = "New interview";
      
      // Create optimistic interview object to show immediately
      const optimisticInterview: Interview = {
        id: optimisticId,
        session_id: sessionId || `offline-${offlineSessionId}`,
        start_time: now,
        candidate_name: candidateName,
        is_active: true
      };
      
      // Update UI immediately while fetching location in background
      setActiveInterview(optimisticInterview);
      
      // Defer getting location to improve performance - get it in background
      const currentLocationPromise = getCurrentLocation();
      
      // Check if we're offline and have an offline session
      if (offlineSessionId !== null) {
        // Save interview to offline storage with low-precision location first
        const initialLocation = await currentLocationPromise;
        
        const id = await saveOfflineInterview(
          offlineSessionId,
          candidateName,
          projectId || null,
          now,
          initialLocation
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
        
        if (initialLocation) {
          offlineInterview.start_latitude = initialLocation.latitude;
          offlineInterview.start_longitude = initialLocation.longitude;
          offlineInterview.start_address = initialLocation.address;
        }
        
        setActiveInterview(offlineInterview);
        
        toast({
          title: "Interview Started",
          description: isOnline() ? "" : "Interview has been saved locally",
        });
        
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
      operationInProgressRef.current = false;
    }
  }, [sessionId, offlineSessionId, setActiveInterview, setIsInterviewLoading, toast, setActiveOfflineInterviewId]);

  return { startInterview };
};
