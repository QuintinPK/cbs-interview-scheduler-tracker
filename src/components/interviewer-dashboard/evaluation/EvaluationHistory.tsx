
import React, { useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";
import { format } from "date-fns";
import { Evaluation } from "@/types";

interface EvaluationHistoryProps {
  evaluations: Evaluation[];
  loading: boolean;
  initialLoadDone: boolean;
}

export const EvaluationHistory = ({
  evaluations,
  loading,
  initialLoadDone
}: EvaluationHistoryProps) => {
  const evaluationHistoryItems = useMemo(() => {
    return evaluations.map((evaluation) => (
      <div key={evaluation.id} className="relative pl-10 pb-8">
        <div className="absolute left-[15px] -translate-x-1/2 bg-background border-4 border-white rounded-full">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Star className="h-3 w-3 text-primary/70" />
          </div>
        </div>
        
        <div className="text-sm">
          <p className="font-medium mb-1">
            {format(new Date(evaluation.created_at), 'MMMM d, yyyy')}
          </p>
          <p className="text-muted-foreground">
            Rating: <span className="font-medium">{evaluation.rating}/5</span>
          </p>
          {evaluation.remarks && (
            <p className="text-muted-foreground mt-2">"{evaluation.remarks}"</p>
          )}
        </div>
      </div>
    ));
  }, [evaluations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Evaluation History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !initialLoadDone ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : evaluations.length > 0 ? (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            {evaluationHistoryItems}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No evaluation history available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
