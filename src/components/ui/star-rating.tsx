
import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
  className?: string;
}

export const StarRating = ({
  rating,
  max = 5,
  size = 20,
  onRate,
  readOnly = false,
  className,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const filled = readOnly
          ? starValue <= rating
          : starValue <= (hoverRating || rating);

        return (
          <Star
            key={i}
            size={size}
            className={cn(
              "cursor-pointer transition-all",
              filled ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300",
              !readOnly && "hover:scale-110"
            )}
            onClick={() => !readOnly && onRate && onRate(starValue)}
            onMouseEnter={() => !readOnly && setHoverRating(starValue)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
          />
        );
      })}
    </div>
  );
};
