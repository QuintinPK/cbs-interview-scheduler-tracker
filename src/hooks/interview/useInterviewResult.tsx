
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { isOnline, updateOfflineInterviewResult } from "@/lib/offlineDB";
import { getSyncManager } from "@/lib/sync";

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
        const syncManager = getSyncManager();
        if (activeInterview.id && !activeInterview.id.startsWith('offline-') && !activeInterview.id.startsWith('temp-')) {
          await syncManager.queueOperation(
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
          await syncManager.queueOperation(
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
          description: `Interview marked as ${result}. Will sync when online.`,
        });
        
        return;
      }
      
      // Online mode - direct update to Supabase
      if (isOnline()) {
        const { error } = await supabase
          .from('interviews')
          .update({
            result,
            is_active: false
          })
          .eq('id', activeInterview.id);
          
        if (error) {
          console.error('[InterviewResult] Error updating interview:', error);
          
          // If online but update failed, queue for sync
          const syncManager = getSyncManager();
          await syncManager.queueOperation(
            'INTERVIEW_RESULT',
            { result },
            {
              onlineId: activeInterview.id,
              entityType: 'interview',
              priority: 3
            }
          );
          
          toast({
            title: "Interview Completed",
            description: `Interview marked as ${result}. Queued for sync.`,
          });
        } else {
          toast({
            title: "Interview Completed",
            description: `Interview marked as ${result}.`,
          });
        }
      } else {
        // Offline mode - queue for sync
        const syncManager = getSyncManager();
        await syncManager.queueOperation(
          'INTERVIEW_RESULT',
          { result },
          {
            onlineId: activeInterview.id,
            entityType: 'interview',
            priority: 3
          }
        );
        
        toast({
          title: "Interview Completed",
          description: `Interview marked as ${result}. Will sync when online.`,
        });
      }
      
      setActiveInterview(null);
      setShowResultDialog(false);
      
    } catch (error) {
      console.error('[InterviewResult] Error setting interview result:', error);
      toast({
        title: "Error",
        description: "Could not set interview result",
        variant: "destructive",
      });
    } finally {
      setIsInterviewLoading(false);
    }
  }, [activeInterview, activeOfflineInterviewId, setActiveInterview, setShowResultDialog, setIsInterviewLoading, setActiveOfflineInterviewId, toast]);

  const cancelResultDialog = useCallback(() => {
    setShowResultDialog(false);
  }, [setShowResultDialog]);

  return {
    setInterviewResult,
    cancelResultDialog
  };
};
