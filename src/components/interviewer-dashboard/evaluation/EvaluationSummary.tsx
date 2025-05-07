
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { Loader2, FileBadge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EvaluationSummaryProps {
  averageRating: number | null;
  loadingRating: boolean;
  onAddEvaluation: () => void;
}

export const EvaluationSummary = ({
  averageRating,
  loadingRating,
  onAddEvaluation
}: EvaluationSummaryProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-xl font-semibold">
        <div className="flex items-center gap-2">
          <FileBadge className="h-5 w-5 text-primary" />
          Interviewer Evaluations
        </div>
      </CardTitle>
      
      <div className="flex items-center gap-4">
        {loadingRating ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Average Rating:</span>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : averageRating !== null ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Average Rating:</span>
            <div className="flex items-center">
              <StarRating rating={averageRating} readOnly size={18} />
              <span className="ml-2 font-semibold">{averageRating}</span>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">No ratings</span>
        )}
        
        <Button 
          size="sm" 
          onClick={onAddEvaluation}
          className="ml-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Evaluation
        </Button>
      </div>
    </CardHeader>
  );
};
