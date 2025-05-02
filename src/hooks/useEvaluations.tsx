
import { useEvaluationBase } from "./evaluation/useEvaluationBase";
import { useEvaluationActions } from "./evaluation/useEvaluationActions";
import { useEvaluationLoader } from "./evaluation/useEvaluationLoader";
import { useEvaluationStats } from "./evaluation/useEvaluationStats";

export const useEvaluations = () => {
  const { loading, error: baseError, tags, loadEvaluationTags } = useEvaluationBase();
  const { addEvaluation, updateEvaluation, saving, error: actionError } = useEvaluationActions();
  const { evaluations, loadingEvaluations, error: loaderError, loadEvaluationsByInterviewer } = useEvaluationLoader();
  const { getAverageRating, getAllAverageRatings, loading: statsLoading } = useEvaluationStats();

  return {
    evaluations,
    tags,
    loading: loading || loadingEvaluations || saving || statsLoading,
    saving,
    error: baseError || actionError || loaderError,
    loadEvaluationTags,
    loadEvaluationsByInterviewer,
    addEvaluation,
    updateEvaluation,
    getAverageRating,
    getAllAverageRatings
  };
};
