
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { getCurrentLocation } from "@/lib/utils";

/**
 * Hook for stopping interviews
 */
export const useInterviewStop = (
  activeInterview: Interview | null,
  setShowResultDialog: (show: boolean) => void,
  setIsInterviewLoading: (isLoading: boolean) => void
) => {
  const { toast } = useToast();

  const stopInterview = useCallback(async () => {
    if (!activeInterview) return;
    
    try {
      setIsInterviewLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      // Update interview with end location but don't set result yet
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
  }, [activeInterview, setShowResultDialog, setIsInterviewLoading, toast]);

  return { stopInterview };
};
