
import React from "react";
import { Loader2 } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";

interface InterviewerRatingProps {
  rating: number | undefined;
  ratingsLoading: boolean;
  interviewerId: string;
}

const InterviewerRating: React.FC<InterviewerRatingProps> = ({
  rating,
  ratingsLoading,
  interviewerId
}) => {
  if (ratingsLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-xs text-muted-foreground">Loading</span>
      </div>
    );
  }
  
  if (rating) {
    return (
      <div className="flex items-center gap-1">
        <StarRating rating={rating} readOnly size={16} />
        <span className="text-sm ml-1">{rating}</span>
      </div>
    );
  }
  
  return <span className="text-muted-foreground text-sm">Not rated</span>;
};

export default InterviewerRating;
