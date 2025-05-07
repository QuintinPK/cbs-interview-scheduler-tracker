
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";

/**
 * Hook for handling interview results
 */
export const useInterviewResult = (
  activeInterview: Interview | null,
  setActiveInterview: (interview: Interview | null) => void,
  setShowResultDialog: (show: boolean) => void,
  setIsInterviewLoading: (isLoading: boolean) => void
) => {
  const { toast } = useToast();

  const setInterviewResult = useCallback(async (result: 'response' | 'non-response') => {
    if (!activeInterview) return;
    
    try {
      setIsInterviewLoading(true);
      
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
  }, [activeInterview, setActiveInterview, setShowResultDialog, setIsInterviewLoading, toast]);

  const cancelResultDialog = useCallback(() => {
    setShowResultDialog(false);
  }, [setShowResultDialog]);

  return { setInterviewResult, cancelResultDialog };
};
