
import { useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { getCurrentLocation } from "@/lib/utils";
import { isOnline, updateOfflineInterview } from "@/lib/offlineDB";
import { syncQueue } from "@/lib/syncQueue";

/**
 * Hook for stopping interviews - optimized for mobile performance
 */
export const useInterviewStop = (
  activeInterview: Interview | null,
  setShowResultDialog: (show: boolean) => void,
  setIsInterviewLoading: (isLoading: boolean) => void,
  activeOfflineInterviewId: number | null = null
) => {
  const { toast } = useToast();
  const operationInProgressRef = useRef(false);

  const stopInterview = useCallback(async () => {
    if (!activeInterview) return;
    
    // Prevent multiple simultaneous calls
    if (operationInProgressRef.current) {
      return;
    }
    
    operationInProgressRef.current = true;
    
    try {
      // Update UI immediately for better perceived performance
      setIsInterviewLoading(true);
      
      const now = new Date().toISOString();
      console.log(`[InterviewStop] Stopping interview ${activeInterview.id} at ${now}`);
      
      // Get location in background - fire and forget, don't wait
      const locationPromise = getCurrentLocation({ 
        timeout: 3000, 
        highAccuracy: false // Get a fast location first, can improve later
      });
      
      // Process location asynchronously - don't block UI
      locationPromise.then(async (currentLocation) => {
        try {
          console.log(`[InterviewStop] Got location:`, currentLocation);
          
          // Check if this is an offline interview
          if (activeOfflineInterviewId !== null) {
            // Update the offline interview with end details
            await updateOfflineInterview(
              activeOfflineInterviewId,
              now,
              currentLocation
            );
            
            console.log(`[InterviewStop] Updated offline interview ${activeOfflineInterviewId}`);
            
            // Queue the sync operation if we have an online interview ID
            if (activeInterview.id && !activeInterview.id.startsWith('offline-') && !activeInterview.id.startsWith('temp-')) {
              await syncQueue.queueOperation(
                'INTERVIEW_END',
                {
                  end_time: now,
                  end_latitude: currentLocation?.latitude,
                  end_longitude: currentLocation?.longitude,
                  end_address: currentLocation?.address
                },
                {
                  offlineId: activeOfflineInterviewId,
                  onlineId: activeInterview.id,
                  entityType: 'interview',
                  priority: 2 // High priority
                }
              );
              
              console.log(`[InterviewStop] Queued sync for interview ${activeInterview.id} with location`);
            } else {
              // Just queue it with the offline ID
              await syncQueue.queueOperation(
                'INTERVIEW_END',
                {
                  end_time: now,
                  end_latitude: currentLocation?.latitude,
                  end_longitude: currentLocation?.longitude,
                  end_address: currentLocation?.address
                },
                {
                  offlineId: activeOfflineInterviewId,
                  entityType: 'interview',
                  priority: 2
                }
              );
              
              console.log(`[InterviewStop] Queued sync for offline interview ${activeOfflineInterviewId} with location`);
            }
            return;
          }
          
          // For online interviews with a valid ID
          if (activeInterview.id && !activeInterview.id.startsWith('temp-')) {
            if (isOnline()) {
              try {
                // For online mode, update in background
                console.log(`[InterviewStop] Updating online interview ${activeInterview.id} with location`);
                await supabase
                  .from('interviews')
                  .update({
                    end_time: now,
                    end_latitude: currentLocation?.latitude || null,
                    end_longitude: currentLocation?.longitude || null,
                    end_address: currentLocation?.address || null,
                  })
                  .eq('id', activeInterview.id);
              } catch (err) {
                console.error("[InterviewStop] Error updating interview:", err);
                
                // If online update fails, queue it for later
                await syncQueue.queueOperation(
                  'INTERVIEW_END',
                  {
                    end_time: now,
                    end_latitude: currentLocation?.latitude,
                    end_longitude: currentLocation?.longitude,
                    end_address: currentLocation?.address
                  },
                  {
                    onlineId: activeInterview.id,
                    entityType: 'interview'
                  }
                );
                
                console.log(`[InterviewStop] Online update failed, queued sync for interview ${activeInterview.id}`);
              }
            } else {
              // If offline, queue the update
              await syncQueue.queueOperation(
                'INTERVIEW_END',
                {
                  end_time: now,
                  end_latitude: currentLocation?.latitude,
                  end_longitude: currentLocation?.longitude,
                  end_address: currentLocation?.address
                },
                {
                  onlineId: activeInterview.id,
                  entityType: 'interview'
                }
              );
              
              console.log(`[InterviewStop] Offline mode, queued sync for interview ${activeInterview.id}`);
            }
          } else {
            console.log(`[InterviewStop] Interview has temporary ID ${activeInterview.id}, not syncing yet`);
          }
        } catch (locationError) {
          console.error("[InterviewStop] Location processing error:", locationError);
          
          // Even if location fails, still try to update with just the end time
          if (activeOfflineInterviewId !== null) {
            await updateOfflineInterview(activeOfflineInterviewId, now);
            
            // Queue sync with just end time
            if (activeInterview.id && !activeInterview.id.startsWith('offline-') && !activeInterview.id.startsWith('temp-')) {
              await syncQueue.queueOperation(
                'INTERVIEW_END',
                { end_time: now },
                {
                  offlineId: activeOfflineInterviewId,
                  onlineId: activeInterview.id,
                  entityType: 'interview'
                }
              );
            } else {
              await syncQueue.queueOperation(
                'INTERVIEW_END',
                { end_time: now },
                {
                  offlineId: activeOfflineInterviewId,
                  entityType: 'interview'
                }
              );
            }
          } else if (activeInterview.id && !activeInterview.id.startsWith('temp-')) {
            // For online interviews, queue with just end time if location fails
            await syncQueue.queueOperation(
              'INTERVIEW_END',
              { end_time: now },
              {
                onlineId: activeInterview.id,
                entityType: 'interview'
              }
            );
          }
        }
      }).catch(error => {
        console.error("[InterviewStop] Background location error:", error);
      });
      
      // Show dialog - IMPORTANT: Set loading to false before showing the dialog
      // This fix allows the buttons in the dialog to be clickable
      setIsInterviewLoading(false);
      setShowResultDialog(true);
      
    } catch (error) {
      console.error("Error stopping interview:", error);
      toast({
        title: "Error",
        description: "Could not stop interview",
        variant: "destructive",
      });
      setIsInterviewLoading(false);
    } finally {
      operationInProgressRef.current = false;
    }
  }, [activeInterview, activeOfflineInterviewId, setShowResultDialog, setIsInterviewLoading, toast]);

  return { stopInterview };
};
