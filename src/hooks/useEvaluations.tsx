
import { useEvaluationBase } from "./evaluation/useEvaluationBase";
import { useEvaluationActions } from "./evaluation/useEvaluationActions";
import { useEvaluationLoader } from "./evaluation/useEvaluationLoader";
import { useEvaluationStats } from "./evaluation/useEvaluationStats";
import { supabase } from "@/integrations/supabase/client";

export const useEvaluations = () => {
  const { loading, tags, loadEvaluationTags } = useEvaluationBase();
  const { addEvaluation } = useEvaluationActions();
  const { evaluations, loadEvaluationsByInterviewer } = useEvaluationLoader();
  const { getAverageRating, getAllAverageRatings } = useEvaluationStats();

  return {
    evaluations,
    tags,
    loading,
    loadEvaluationTags,
    loadEvaluationsByInterviewer,
    addEvaluation,
    getAverageRating,
    getAllAverageRatings
  };
};
