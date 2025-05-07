
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBadge, Loader2, Plus, Star } from "lucide-react";
import { Evaluation } from "@/types";
import { EvaluationSummary } from "./EvaluationSummary";

interface EvaluationCardProps {
  loading: boolean;
  initialLoadDone: boolean;
  evaluations: Evaluation[];
  averageRating: number | null;
  loadingRating: boolean;
  onAddEvaluation: () => void;
  children?: React.ReactNode;
}

export const EvaluationCard: React.FC<EvaluationCardProps> = ({
  loading,
  initialLoadDone,
  evaluations,
  averageRating,
  loadingRating,
  onAddEvaluation,
  children,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">
          <div className="flex items-center gap-2">
            <FileBadge className="h-5 w-5 text-primary" />
            Interviewer Evaluations
          </div>
        </CardTitle>
        
        <div className="flex items-center gap-4">
          <EvaluationSummary 
            averageRating={averageRating}
            loadingRating={loadingRating}
          />
          
          <Button 
            size="sm" 
            onClick={onAddEvaluation}
            className="ml-2"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Evaluation
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && !initialLoadDone ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : evaluations.length === 0 ? (
          <div className="text-center py-10 border-t">
            <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground">No evaluations have been recorded for this interviewer yet.</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              Evaluations help measure interviewer performance and identify areas for improvement.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
