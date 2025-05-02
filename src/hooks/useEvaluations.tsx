
import { useEvaluationBase } from "./evaluation/useEvaluationBase";
import { useEvaluationActions } from "./evaluation/useEvaluationActions";
import { useEvaluationLoader } from "./evaluation/useEvaluationLoader";
import { useEvaluationStats } from "./evaluation/useEvaluationStats";
import { useMemo, useCallback } from "react";

export const useEvaluations = () => {
  const { loading: baseLoading, error: baseError, tags, loadEvaluationTags } = useEvaluationBase();
  const { addEvaluation, updateEvaluation, saving, error: actionError } = useEvaluationActions();
  const { evaluations, loadingEvaluations, error: loaderError, loadEvaluationsByInterviewer } = useEvaluationLoader();
  const { getAverageRating, getAllAverageRatings, loading: statsLoading } = useEvaluationStats();

  // Memoize the combined loading state to prevent unnecessary re-renders
  const loading = useMemo(() => {
    return baseLoading || loadingEvaluations || statsLoading;
  }, [baseLoading, loadingEvaluations, statsLoading]);

  // Memoize the combined error state
  const error = useMemo(() => {
    return baseError || actionError || loaderError;
  }, [baseError, actionError, loaderError]);

  // Enhance loadEvaluationsByInterviewer to accept force refresh parameter
  const loadEvaluations = useCallback((interviewerId: string, forceRefresh = false) => {
    return loadEvaluationsByInterviewer(interviewerId, forceRefresh);
  }, [loadEvaluationsByInterviewer]);
  
  // Enhance getAverageRating to accept force refresh parameter
  const getAvgRating = useCallback((interviewerId: string, forceRefresh = false) => {
    return getAverageRating(interviewerId, forceRefresh);
  }, [getAverageRating]);
  
  // Enhance getAllAverageRatings to accept force refresh parameter
  const getAllAvgRatings = useCallback((forceRefresh = false) => {
    return getAllAverageRatings(forceRefresh);
  }, [getAllAverageRatings]);

  return {
    evaluations,
    tags,
    loading,
    saving,
    error,
    loadEvaluationTags,
    loadEvaluationsByInterviewer: loadEvaluations,
    addEvaluation,
    updateEvaluation,
    getAverageRating: getAvgRating,
    getAllAverageRatings: getAllAvgRatings
  };
};
