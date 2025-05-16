
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
      
      // Get location in background - fire and forget
      const locationPromise = getCurrentLocation({ timeout: 2000 }); // Short timeout for speed
      
      // Process location asynchronously - don't block UI
      locationPromise.then(async (currentLocation) => {
        const now = new Date().toISOString();
        
        // Check if this is an offline interview
        if (activeOfflineInterviewId !== null) {
          try {
            // Update the offline interview with end details
            await updateOfflineInterview(
              activeOfflineInterviewId,
              now,
              currentLocation
            );
            
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
            }
          } catch (err) {
            console.error("Background error updating offline interview:", err);
          }
          return;
        }
        
        // For online interviews with a valid ID
        if (activeInterview.id && !activeInterview.id.startsWith('temp-')) {
          if (isOnline()) {
            // For online mode, update in background
            try {
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
              console.error("Background error updating interview:", err);
              
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
          }
        }
      }).catch(error => {
        console.error("Error in background location processing:", error);
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
      operationInProgressRef.current = false;
    }
    
    operationInProgressRef.current = false;
  }, [activeInterview, activeOfflineInterviewId, setShowResultDialog, setIsInterviewLoading, toast]);

  return { stopInterview };
};
