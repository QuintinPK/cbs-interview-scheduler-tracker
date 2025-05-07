
import { useInterviewState } from "./interview/useInterviewState";
import { useInterviewStart } from "./interview/useInterviewStart";
import { useInterviewStop } from "./interview/useInterviewStop";
import { useInterviewResult } from "./interview/useInterviewResult";

/**
 * Main hook that combines all interview-related hooks
 */
export const useInterviewActions = (sessionId: string | null) => {
  const {
    activeInterview,
    setActiveInterview,
    isInterviewLoading,
    setIsInterviewLoading,
    showResultDialog,
    setShowResultDialog,
    fetchActiveInterview
  } = useInterviewState(sessionId);
  
  const { startInterview } = useInterviewStart(
    sessionId,
    setActiveInterview,
    setIsInterviewLoading
  );
  
  const { stopInterview } = useInterviewStop(
    activeInterview,
    setShowResultDialog,
    setIsInterviewLoading
  );
  
  const { setInterviewResult, cancelResultDialog } = useInterviewResult(
    activeInterview,
    setActiveInterview,
    setShowResultDialog,
    setIsInterviewLoading
  );
  
  return {
    activeInterview,
    isInterviewLoading,
    showResultDialog,
    startInterview,
    stopInterview,
    setInterviewResult,
    cancelResultDialog,
    fetchActiveInterview
  };
};
