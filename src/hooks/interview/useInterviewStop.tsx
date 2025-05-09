import { useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { getCurrentLocation } from "@/lib/utils";
import { isOnline, updateOfflineInterview } from "@/lib/offlineDB";

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
      
      // Show dialog immediately to improve perceived performance
      setShowResultDialog(true);
      
      // Get location in background - fire and forget
      const locationPromise = getCurrentLocation({ timeout: 2000 }); // Short timeout for speed
      
      // Process location asynchronously - don't block UI
      locationPromise.then(async (currentLocation) => {
        // Check if this is an offline interview
        if (activeOfflineInterviewId !== null) {
          try {
            // Update the offline interview with end details
            await updateOfflineInterview(
              activeOfflineInterviewId,
              new Date().toISOString(),
              currentLocation
            );
          } catch (err) {
            console.error("Background error updating offline interview:", err);
          }
          return;
        }
        
        // For online interviews, proceed as usual
        if (!activeInterview.id || !isOnline()) {
          return;
        }
        
        // For online mode, update in background
        try {
          await supabase
            .from('interviews')
            .update({
              end_time: new Date().toISOString(),
              end_latitude: currentLocation?.latitude || null,
              end_longitude: currentLocation?.longitude || null,
              end_address: currentLocation?.address || null,
            })
            .eq('id', activeInterview.id);
        } catch (err) {
          console.error("Background error updating interview:", err);
        }
      }).catch(error => {
        console.error("Error in background location processing:", error);
      });
      
      // If offline, store the stop intent in localStorage
      if (!isOnline() && activeInterview.id && !activeOfflineInterviewId) {
        const pendingStops = JSON.parse(localStorage.getItem("pending_interview_stops") || "[]");
        pendingStops.push({
          id: activeInterview.id,
          end_time: new Date().toISOString(),
        });
        localStorage.setItem("pending_interview_stops", JSON.stringify(pendingStops));
      }
      
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
    
    // Don't set loading to false here - we want to keep it loading until the result is set
    // setIsInterviewLoading is called in useInterviewResult after result is set
    operationInProgressRef.current = false;
  }, [activeInterview, activeOfflineInterviewId, setShowResultDialog, setIsInterviewLoading, toast]);

  return { stopInterview };
};
