
import React from "react";
import { Loader2, Star } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";

interface EvaluationSummaryProps {
  averageRating: number | null;
  loadingRating: boolean;
}

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({
  averageRating,
  loadingRating,
}) => {
  if (loadingRating) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Average Rating:</span>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (averageRating !== null) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Average Rating:</span>
        <div className="flex items-center">
          <StarRating rating={averageRating} readOnly size={18} />
          <span className="ml-2 font-semibold">{averageRating}</span>
        </div>
      </div>
    );
  }
  
  return <span className="text-muted-foreground">No ratings</span>;
};
