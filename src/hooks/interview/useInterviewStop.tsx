
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { getCurrentLocation } from "@/lib/utils";
import { isOnline, updateOfflineInterview } from "@/lib/offlineDB";

/**
 * Hook for stopping interviews
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
      
      const currentLocation = await getCurrentLocation();
      
      // Check if this is an offline interview
      if (activeOfflineInterviewId !== null) {
        // Update the offline interview with end details
        await updateOfflineInterview(
          activeOfflineInterviewId,
          new Date().toISOString(),
          currentLocation
        );
        
        // Show dialog to select interview result
        setShowResultDialog(true);
        setIsInterviewLoading(false);
        return;
      }
      
      // For online interviews, proceed as usual
      if (!activeInterview.id) {
        throw new Error("Invalid interview ID");
      }
      
      // If we're offline, store the stop intent in localStorage to be processed when back online
      if (!isOnline()) {
        const pendingStops = JSON.parse(localStorage.getItem("pending_interview_stops") || "[]");
        pendingStops.push({
          id: activeInterview.id,
          end_time: new Date().toISOString(),
          end_latitude: currentLocation?.latitude || null,
          end_longitude: currentLocation?.longitude || null,
          end_address: currentLocation?.address || null,
        });
        localStorage.setItem("pending_interview_stops", JSON.stringify(pendingStops));
        
        // Show dialog to select interview result
        setShowResultDialog(true);
        setIsInterviewLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('interviews')
        .update({
          end_time: new Date().toISOString(),
          end_latitude: currentLocation?.latitude || null,
          end_longitude: currentLocation?.longitude || null,
          end_address: currentLocation?.address || null,
        })
        .eq('id', activeInterview.id);
        
      if (error) throw error;
      
      // Show dialog to select interview result
      setShowResultDialog(true);
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
