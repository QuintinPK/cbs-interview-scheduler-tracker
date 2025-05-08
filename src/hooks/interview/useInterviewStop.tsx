
import { useCallback } from "react";
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

  const stopInterview = useCallback(async () => {
    if (!activeInterview) return;
    
    try {
      setIsInterviewLoading(true);
      
      // Get location in background while showing dialog
      const currentLocationPromise = getCurrentLocation();
      
      // Show dialog immediately to improve perceived performance
      setShowResultDialog(true);
      
      // Check if this is an offline interview
      if (activeOfflineInterviewId !== null) {
        // Wait for location to complete
        const currentLocation = await currentLocationPromise;
        
        // Update the offline interview with end details
        await updateOfflineInterview(
          activeOfflineInterviewId,
          new Date().toISOString(),
          currentLocation
        );
        
        setIsInterviewLoading(false);
        return;
      }
      
      // For online interviews, proceed as usual
      if (!activeInterview.id) {
        throw new Error("Invalid interview ID");
      }
      
      // If we're offline, store the stop intent in localStorage to be processed when back online
      if (!isOnline()) {
        // Wait for location
        const currentLocation = await currentLocationPromise;
        
        const pendingStops = JSON.parse(localStorage.getItem("pending_interview_stops") || "[]");
        pendingStops.push({
          id: activeInterview.id,
          end_time: new Date().toISOString(),
          end_latitude: currentLocation?.latitude || null,
          end_longitude: currentLocation?.longitude || null,
          end_address: currentLocation?.address || null,
        });
        localStorage.setItem("pending_interview_stops", JSON.stringify(pendingStops));
        
        setIsInterviewLoading(false);
        return;
      }
      
      // For online mode, update in background
      currentLocationPromise.then(currentLocation => {
        supabase
          .from('interviews')
          .update({
            end_time: new Date().toISOString(),
            end_latitude: currentLocation?.latitude || null,
            end_longitude: currentLocation?.longitude || null,
            end_address: currentLocation?.address || null,
          })
          .eq('id', activeInterview.id)
          .then(({ error }) => {
            if (error) console.error("Error updating interview:", error);
          });
      });
      
    } catch (error) {
      console.error("Error stopping interview:", error);
      toast({
        title: "Error",
        description: "Could not stop interview",
        variant: "destructive",
      });
    } finally {
      setIsInterviewLoading(false);
    }
  }, [activeInterview, activeOfflineInterviewId, setShowResultDialog, setIsInterviewLoading, toast]);

  return { stopInterview };
};
