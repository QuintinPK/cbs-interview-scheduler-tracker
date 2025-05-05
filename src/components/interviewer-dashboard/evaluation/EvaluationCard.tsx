
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Evaluation } from "@/types";
import { EvaluationSummary } from "./EvaluationSummary";
import { EvaluationsList } from "./EvaluationsList";

interface EvaluationCardProps {
  evaluations: Evaluation[];
  loading: boolean;
  initialLoadDone: boolean;
  averageRating: number | null;
  loadingRating: boolean;
  onAddEvaluation: () => void;
  onEditEvaluation: (evaluation: Evaluation) => void;
  groupEvaluationTags: (evaluation: Evaluation) => Record<string, any[]>;
  getProjectName: (projectId: string | null | undefined) => string;
}

export const EvaluationCard = ({
  evaluations,
  loading,
  initialLoadDone,
  averageRating,
  loadingRating,
  onAddEvaluation,
  onEditEvaluation,
  groupEvaluationTags,
  getProjectName
}: EvaluationCardProps) => {
  return (
    <Card>
      <EvaluationSummary 
        averageRating={averageRating}
        loadingRating={loadingRating}
        onAddEvaluation={onAddEvaluation}
      />
      
      <EvaluationsList 
        evaluations={evaluations}
        loading={loading}
        initialLoadDone={initialLoadDone}
        onEditEvaluation={onEditEvaluation}
        groupEvaluationTags={groupEvaluationTags}
        getProjectName={getProjectName}
      />
    </Card>
  );
};
