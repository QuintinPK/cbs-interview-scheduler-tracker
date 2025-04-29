
import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number | null;
  className?: string;
  starSize?: number;
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  className = '', 
  starSize = 4 
}) => {
  if (rating === null) {
    return <span className="text-xs text-gray-400">No ratings</span>;
  }

  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        // Calculate how filled this star should be
        const fill = Math.max(0, Math.min(1, rating - i));
        
        return (
          <div key={i} className="relative">
            {/* Background star (gray) */}
            <Star 
              className={`h-${starSize} w-${starSize} text-gray-300`}
            />
            
            {/* Filled star overlay (partial fill supported) */}
            {fill > 0 && (
              <div 
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star 
                  className={`h-${starSize} w-${starSize} text-yellow-500 fill-yellow-500`}
                />
              </div>
            )}
          </div>
        );
      })}
      <span className="ml-1 text-xs font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

export default RatingStars;
