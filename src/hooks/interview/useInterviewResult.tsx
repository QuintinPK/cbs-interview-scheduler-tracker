
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { isOnline, setOfflineInterviewResult } from "@/lib/offlineDB";

/**
 * Hook for handling interview results
 */
export const useInterviewResult = (
  activeInterview: Interview | null,
  setActiveInterview: (interview: Interview | null) => void,
  setShowResultDialog: (show: boolean) => void,
  setIsInterviewLoading: (isLoading: boolean) => void,
  activeOfflineInterviewId: number | null = null,
  setActiveOfflineInterviewId: ((id: number | null) => void) | undefined = undefined
) => {
  const { toast } = useToast();

  const setInterviewResult = useCallback(async (result: 'response' | 'non-response') => {
    if (!activeInterview) return;
    
    try {
      setIsInterviewLoading(true);
      
      // Check if this is an offline interview
      if (activeOfflineInterviewId !== null && !isOnline()) {
        // Update the offline interview with the result
        await setOfflineInterviewResult(activeOfflineInterviewId, result);
        
        setActiveInterview(null);
        if (setActiveOfflineInterviewId) {
          setActiveOfflineInterviewId(null);
        }
        setShowResultDialog(false);
        
        toast({
          title: "Offline Interview Completed",
          description: `Result: ${result === 'response' ? 'Response' : 'Non-response'}. Will sync when online.`,
        });
        
        setIsInterviewLoading(false);
        return;
      }
      
      // For online interviews, proceed as usual
      const { error } = await supabase
        .from('interviews')
        .update({
          result,
          is_active: false
        })
        .eq('id', activeInterview.id);
        
      if (error) throw error;
      
      setActiveInterview(null);
      setShowResultDialog(false);
      
      toast({
        title: "Interview Completed",
        description: `Result: ${result === 'response' ? 'Response' : 'Non-response'}`,
      });
    } catch (error) {
      console.error("Error setting interview result:", error);
      toast({
        title: "Error",
        description: "Could not complete interview",
        variant: "destructive",
      });
    } finally {
      setIsInterviewLoading(false);
    }
  }, [activeInterview, activeOfflineInterviewId, setActiveInterview, setShowResultDialog, setIsInterviewLoading, toast, setActiveOfflineInterviewId]);

  const cancelResultDialog = useCallback(() => {
    setShowResultDialog(false);
  }, [setShowResultDialog]);

  return { setInterviewResult, cancelResultDialog };
};
