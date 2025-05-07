
// This file serves as a re-export of the evaluation hooks
// to maintain backwards compatibility with existing components

import { useEvaluationLoader } from './evaluation/useEvaluationLoader';
import { useEvaluationActions } from './evaluation/useEvaluationActions';
import { useEvaluationBase } from './evaluation/useEvaluationBase';
import { useEvaluationStats } from './evaluation/useEvaluationStats';

export const useEvaluations = () => {
  const evaluationLoader = useEvaluationLoader();
  const evaluationActions = useEvaluationActions();
  const evaluationBase = useEvaluationBase();
  const evaluationStats = useEvaluationStats();

  return {
    ...evaluationLoader,
    ...evaluationActions,
    ...evaluationBase,
    ...evaluationStats,
  };
};
