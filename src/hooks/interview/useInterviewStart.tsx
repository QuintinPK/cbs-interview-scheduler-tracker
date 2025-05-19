
import { useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { getCurrentLocation } from "@/lib/utils";
import { isOnline, saveOfflineInterview } from "@/lib/offlineDB";
import { syncQueue } from "@/lib/syncQueue";

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
      const currentLocationPromise = getCurrentLocation({
        timeout: 3000,
        highAccuracy: false // Get a fast location first, then improve
      });
      
      // Check if we're offline or have an offline session
      if (!isOnline() || offlineSessionId !== null) {
        // Save interview to offline storage with low-precision location first
        const initialLocation = await currentLocationPromise;
        
        const id = await saveOfflineInterview({
          sessionId: offlineSessionId || -1, // Use -1 as temporary ID if offlineSessionId is null
          candidateName,
          projectId: projectId || null,
          startTime: now,
          location: initialLocation
        });
        
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
        
        // Queue the interview start for sync when online
        if (sessionId) {
          // If we have a valid online session ID, queue the sync operation
          await syncQueue.queueOperation(
            'INTERVIEW_START',
            {
              session_id: sessionId,
              project_id: projectId,
              candidate_name: candidateName,
              start_time: now,
              start_latitude: initialLocation?.latitude,
              start_longitude: initialLocation?.longitude,
              start_address: initialLocation?.address
            },
            {
              offlineId: id,
              entityType: 'interview',
              priority: 2 // High priority
            }
          );
          
          console.log('[InterviewStart] Queued INTERVIEW_START operation with session ID:', sessionId);
        }
        
        toast({
          title: "Interview Started",
          description: isOnline() ? "" : "Interview has been saved locally",
        });
        
        // Try to get a better location in background and update if available
        getCurrentLocation({ highAccuracy: true, timeout: 10000 })
          .then(async betterLocation => {
            if (betterLocation && id) {
              // Update the offline interview with better location data
              try {
                await saveOfflineInterview({
                  sessionId: offlineSessionId || -1,
                  candidateName,
                  projectId: projectId || null,
                  startTime: now,
                  location: betterLocation,
                  id // Pass existing ID to update
                });
                
                // Update the interview state with better location
                setActiveInterview(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    start_latitude: betterLocation.latitude,
                    start_longitude: betterLocation.longitude,
                    start_address: betterLocation.address
                  };
                });
                
                // If we have a session ID, update the sync operation with better location
                if (sessionId) {
                  await syncQueue.queueOperation(
                    'INTERVIEW_UPDATE',
                    {
                      start_latitude: betterLocation.latitude,
                      start_longitude: betterLocation.longitude,
                      start_address: betterLocation.address
                    },
                    {
                      offlineId: id,
                      onlineId: null, // Will be set once first operation completes
                      entityType: 'interview',
                      priority: 1 // Lower priority
                    }
                  );
                }
              } catch (err) {
                console.error('[InterviewStart] Error updating location in background:', err);
              }
            }
          })
          .catch(err => console.error('[InterviewStart] Error getting better location:', err));
        
        setIsInterviewLoading(false);
        operationInProgressRef.current = false;
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
      
      try {
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
        
        // Get better location in background - fire and forget
        getCurrentLocation({ highAccuracy: true, timeout: 10000 })
          .then(async betterLocation => {
            if (betterLocation && data.id) {
              try {
                await supabase
                  .from('interviews')
                  .update({
                    start_latitude: betterLocation.latitude,
                    start_longitude: betterLocation.longitude,
                    start_address: betterLocation.address
                  })
                  .eq('id', data.id);
                
                // Update the interview state with better location
                setActiveInterview(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    start_latitude: betterLocation.latitude,
                    start_longitude: betterLocation.longitude,
                    start_address: betterLocation.address
                  };
                });
              } catch (err) {
                console.error('[InterviewStart] Error updating location in background:', err);
              }
            }
          })
          .catch(err => console.error('[InterviewStart] Error getting better location:', err));
      } catch (error) {
        // If online insert fails, fallback to offline mode + sync queue
        console.error('[InterviewStart] Error during online interview creation, falling back to offline:', error);
        
        // Save locally
        const id = await saveOfflineInterview({
          sessionId: -1, // Temporary offline ID
          candidateName,
          projectId: projectId || null,
          startTime: now,
          location: currentLocation
        });
        
        if (setActiveOfflineInterviewId) {
          setActiveOfflineInterviewId(id);
        }
        
        // Queue for syncing
        await syncQueue.queueOperation(
          'INTERVIEW_START',
          {
            session_id: sessionId,
            project_id: projectId || interviewProjectId,
            candidate_name: candidateName,
            start_time: now,
            start_latitude: currentLocation?.latitude,
            start_longitude: currentLocation?.longitude,
            start_address: currentLocation?.address
          },
          {
            offlineId: id,
            entityType: 'interview',
            priority: 2
          }
        );
        
        // Update UI with offline interview
        const offlineInterview: Interview = {
          id: `offline-${id}`,
          session_id: sessionId,
          candidate_name: candidateName,
          start_time: now,
          is_active: true,
          start_latitude: currentLocation?.latitude,
          start_longitude: currentLocation?.longitude,
          start_address: currentLocation?.address
        };
        
        setActiveInterview(offlineInterview);
        
        toast({
          title: "Interview Started (Offline Mode)",
          description: "Will sync when connection improves"
        });
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        title: "Error",
        description: "Could not start interview",
        variant: "destructive",
      });
      
      // Clear optimistic UI update
      setActiveInterview(null);
    } finally {
      setIsInterviewLoading(false);
      operationInProgressRef.current = false;
    }
  }, [sessionId, offlineSessionId, setActiveInterview, setIsInterviewLoading, toast, setActiveOfflineInterviewId]);

  return { startInterview };
};
