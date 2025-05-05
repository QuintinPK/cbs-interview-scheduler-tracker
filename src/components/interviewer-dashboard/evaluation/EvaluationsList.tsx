
import React, { useMemo } from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { Loader2, Star, Edit } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Evaluation } from "@/types";

interface EvaluationsListProps {
  evaluations: Evaluation[];
  loading: boolean;
  initialLoadDone: boolean;
  onEditEvaluation: (evaluation: Evaluation) => void;
  groupEvaluationTags: (evaluation: Evaluation) => Record<string, any[]>;
  getProjectName: (projectId: string | null | undefined) => string;
}

export const EvaluationsList = ({
  evaluations,
  loading,
  initialLoadDone,
  onEditEvaluation,
  groupEvaluationTags,
  getProjectName
}: EvaluationsListProps) => {
  const evaluationItems = useMemo(() => {
    console.log("Building evaluation items from:", evaluations.length, "evaluations");
    return evaluations.map((evaluation) => (
      <div key={evaluation.id} className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StarRating rating={evaluation.rating} readOnly size={16} />
            <span className="text-sm text-muted-foreground">
              {format(new Date(evaluation.created_at), 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {evaluation.project_id && (
              <Badge variant="outline">
                {getProjectName(evaluation.project_id)}
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => onEditEvaluation(evaluation)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {evaluation.remarks && (
          <p className="text-sm border-l-2 border-primary/30 pl-3 py-1 bg-primary/5 rounded">
            {evaluation.remarks}
          </p>
        )}
        
        {evaluation.tags && Array.isArray(evaluation.tags) && evaluation.tags.length > 0 && (
          <div className="space-y-2">
            {Object.entries(groupEvaluationTags(evaluation)).map(([category, tags]) => (
              <div key={category} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">{category}</div>
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  }, [evaluations, groupEvaluationTags, getProjectName, onEditEvaluation]);
  
  if (loading && !initialLoadDone) {
    return (
      <CardContent>
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CardContent>
    );
  }
  
  if (evaluations.length === 0) {
    return (
      <CardContent>
        <div className="text-center py-10 border-t">
          <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-muted-foreground">No evaluations have been recorded for this interviewer yet.</p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Evaluations help measure interviewer performance and identify areas for improvement.
          </p>
        </div>
      </CardContent>
    );
  }
  
  return (
    <CardContent>
      <div className="divide-y">
        {evaluationItems}
      </div>
    </CardContent>
  );
};
