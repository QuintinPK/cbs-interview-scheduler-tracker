
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { InterviewerRating } from '@/types/evaluation';

interface RatingsListProps {
  ratings: InterviewerRating[];
  loading: boolean;
}

export function RatingsList({ ratings, loading }: RatingsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Rating History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ratings.length > 0 ? (
          <div className="space-y-4 divide-y">
            {ratings.map(rating => (
              <div key={rating.id} className="pt-4 first:pt-0">
                <div className="flex items-center justify-between">
                  <StarRating rating={rating.score} readOnly size={16} />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(rating.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                
                {rating.comment && (
                  <div className="mt-2 text-sm bg-muted/50 p-3 rounded-md">
                    <p className="italic text-muted-foreground">{rating.comment}</p>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-muted-foreground">
                  Rated by {rating.createdBy}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No rating history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
