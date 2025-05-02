
import { useEvaluationBase } from "./evaluation/useEvaluationBase";
import { useEvaluationActions } from "./evaluation/useEvaluationActions";
import { useEvaluationLoader } from "./evaluation/useEvaluationLoader";
import { useEvaluationStats } from "./evaluation/useEvaluationStats";
import { useMemo } from "react";

export const useEvaluations = () => {
  const { loading, error: baseError, tags, loadEvaluationTags } = useEvaluationBase();
  const { addEvaluation, updateEvaluation, saving, error: actionError } = useEvaluationActions();
  const { evaluations, loadingEvaluations, error: loaderError, loadEvaluationsByInterviewer } = useEvaluationLoader();
  const { getAverageRating, getAllAverageRatings, loading: statsLoading } = useEvaluationStats();

  // Memoize the combined loading state to prevent unnecessary re-renders
  const isLoading = useMemo(() => {
    return loading || loadingEvaluations || saving || statsLoading;
  }, [loading, loadingEvaluations, saving, statsLoading]);

  // Memoize the combined error state
  const error = useMemo(() => {
    return baseError || actionError || loaderError;
  }, [baseError, actionError, loaderError]);

  return {
    evaluations,
    tags,
    loading: isLoading,
    saving,
    error,
    loadEvaluationTags,
    loadEvaluationsByInterviewer,
    addEvaluation,
    updateEvaluation,
    getAverageRating,
    getAllAverageRatings
  };
};
