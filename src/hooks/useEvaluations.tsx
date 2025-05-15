
import { useEvaluationBase } from "./evaluation/useEvaluationBase";
import { useEvaluationActions } from "./evaluation/useEvaluationActions";
import { useEvaluationLoader } from "./evaluation/useEvaluationLoader";
import { useEvaluationStats } from "./evaluation/useEvaluationStats";
import { useMemo, useCallback } from "react";
import { Evaluation } from "@/types";

export const useEvaluations = () => {
  const { loading: baseLoading, error: baseError, tags, loadEvaluationTags } = useEvaluationBase();
  const { addEvaluation, updateEvaluation, saving, error: actionError } = useEvaluationActions();
  const { 
    evaluations, 
    evaluationTags, 
    loading: loaderLoading, 
    loadingEvaluations, 
    error: loaderError, 
    loadEvaluationsByInterviewer 
  } = useEvaluationLoader(undefined);
  const { 
    stats, 
    getAverageRating, 
    getAllAverageRatings, 
    loading: statsLoading, 
    error: statsError 
  } = useEvaluationStats(undefined);

  // Memoize the combined loading state to prevent unnecessary re-renders
  const loading = useMemo(() => {
    return baseLoading || loaderLoading || statsLoading;
  }, [baseLoading, loaderLoading, statsLoading]);

  // Memoize the combined error state
  const error = useMemo(() => {
    if (baseError) console.error("Base error:", baseError);
    if (actionError) console.error("Action error:", actionError);
    if (loaderError) console.error("Loader error:", loaderError);
    if (statsError) console.error("Stats error:", statsError);
    
    return baseError || actionError || loaderError || statsError;
  }, [baseError, actionError, loaderError, statsError]);

  // Enhance loadEvaluationsByInterviewer to accept force refresh parameter
  const loadEvaluations = useCallback(async (interviewerId: string, forceRefresh = false) => {
    console.log("useEvaluations - loadEvaluations called for:", interviewerId, "forceRefresh:", forceRefresh);
    try {
      const result = await loadEvaluationsByInterviewer(interviewerId, forceRefresh);
      console.log("useEvaluations - loadEvaluations result:", result ? result.length : 0, "evaluations");
      return result;
    } catch (err) {
      console.error("Error loading evaluations:", err);
      return [];
    }
  }, [loadEvaluationsByInterviewer]);
  
  // Enhance getAverageRating to accept force refresh parameter
  const getAvgRating = useCallback(async (interviewerId: string, forceRefresh = false) => {
    console.log("useEvaluations - getAvgRating called for:", interviewerId, "forceRefresh:", forceRefresh);
    try {
      const result = await getAverageRating(interviewerId, forceRefresh);
      console.log("useEvaluations - getAvgRating result:", result);
      return result;
    } catch (err) {
      console.error("Error getting average rating:", err);
      return null;
    }
  }, [getAverageRating]);
  
  // Enhance getAllAverageRatings to accept force refresh parameter
  const getAllAvgRatings = useCallback(async (forceRefresh = false) => {
    console.log("useEvaluations - getAllAvgRatings called, forceRefresh:", forceRefresh);
    try {
      const result = await getAllAverageRatings(forceRefresh);
      console.log("useEvaluations - getAllAvgRatings result:", Object.keys(result).length, "ratings");
      return result;
    } catch (err) {
      console.error("Error getting all average ratings:", err);
      return {};
    }
  }, [getAllAverageRatings]);

  // Debug the current state
  console.log("useEvaluations - Current state:", {
    evaluationsCount: evaluations.length,
    tags: tags.length,
    loading,
    error
  });

  return {
    evaluations,
    evaluationTags,
    tags,
    loading,
    loadingEvaluations,
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
