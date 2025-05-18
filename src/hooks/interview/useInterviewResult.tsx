
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { isOnline, updateOfflineInterviewResult } from "@/lib/offlineDB";
import { syncQueue } from "@/lib/syncQueue";

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
      console.log(`[InterviewResult] Setting result ${result} for interview ${activeInterview.id}`);
      
      // Check if this is an offline interview
      if (activeOfflineInterviewId !== null) {
        // Update the offline interview with the result
        await updateOfflineInterviewResult(activeOfflineInterviewId, result);
        console.log(`[InterviewResult] Updated offline interview ${activeOfflineInterviewId} with result ${result}`);
        
        // Queue the sync operation if we have an online interview ID
        if (activeInterview.id && !activeInterview.id.startsWith('offline-') && !activeInterview.id.startsWith('temp-')) {
          await syncQueue.queueOperation(
            'INTERVIEW_RESULT',
            { result },
            {
              offlineId: activeOfflineInterviewId,
              onlineId: activeInterview.id,
              entityType: 'interview',
              priority: 3 // Highest priority
            }
          );
          console.log(`[InterviewResult] Queued result sync for interview ${activeInterview.id}`);
        } else {
          // Just queue it with the offline ID
          await syncQueue.queueOperation(
            'INTERVIEW_RESULT',
            { result },
            {
              offlineId: activeOfflineInterviewId,
              entityType: 'interview',
              priority: 3
            }
          );
          console.log(`[InterviewResult] Queued result sync for offline interview ${activeOfflineInterviewId}`);
        }
        
        setActiveInterview(null);
        if (setActiveOfflineInterviewId) {
          setActiveOfflineInterviewId(null);
        }
        setShowResultDialog(false);
        
        toast({
          title: "Interview Completed",
          description: `Result: ${result === 'response' ? 'Response' : 'Non-response'}. ${!isOnline() ? 'Will sync when online.' : ''}`,
        });
        
        setIsInterviewLoading(false);
        return;
      }
      
      // For online interviews, proceed as usual if online
      if (isOnline() && activeInterview.id && !activeInterview.id.startsWith('temp-')) {
        try {
          const { error } = await supabase
            .from('interviews')
            .update({
              result,
              is_active: false
            })
            .eq('id', activeInterview.id);
            
          if (error) throw error;
          console.log(`[InterviewResult] Updated online interview ${activeInterview.id} with result ${result}`);
        } catch (err) {
          console.error('[InterviewResult] Error updating interview result online:', err);
          
          // If online update fails, queue it
          await syncQueue.queueOperation(
            'INTERVIEW_RESULT',
            { result },
            {
              onlineId: activeInterview.id,
              entityType: 'interview',
              priority: 3
            }
          );
          console.log(`[InterviewResult] Online update failed, queued result sync for interview ${activeInterview.id}`);
        }
      } else if (activeInterview.id) {
        // If offline with a valid interview ID, queue it
        await syncQueue.queueOperation(
          'INTERVIEW_RESULT',
          { result },
          {
            onlineId: activeInterview.id,
            entityType: 'interview',
            priority: 3 // Highest priority
          }
        );
        console.log(`[InterviewResult] Offline mode, queued result sync for interview ${activeInterview.id}`);
      }
      
      setActiveInterview(null);
      setShowResultDialog(false);
      
      toast({
        title: "Interview Completed",
        description: `Result: ${result === 'response' ? 'Response' : 'Non-response'}${!isOnline() ? '. Will sync when online.' : ''}`,
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
