
import React, { useEffect, useState } from 'react';
import { useInterviewerRatings } from '@/hooks/useInterviewerRatings';
import { Interviewer } from '@/types/index';
import { RatingsSummary } from '@/components/ratings/RatingsSummary';
import { RatingsList } from '@/components/ratings/RatingsList';
import { RatingDialog } from '@/components/ratings/RatingDialog';

interface RatingsTabProps {
  interviewer: Interviewer | null;
}

export function RatingsTab({ interviewer }: RatingsTabProps) {
  const { ratings, stats, loading, fetchRatings, addRating } = useInterviewerRatings();
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);

  useEffect(() => {
    if (interviewer?.id) {
      fetchRatings(interviewer.id);
    }
  }, [interviewer?.id, fetchRatings]);

  const handleAddRating = async (score: number, comment?: string) => {
    if (!interviewer?.id) return false;
    return await addRating(interviewer.id, score, comment);
  };

  if (!interviewer) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center text-muted-foreground">
        Interviewer data is loading or not available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary Card */}
      <RatingsSummary
        stats={stats}
        loading={loading}
        onAddRating={() => setIsRatingDialogOpen(true)}
      />
      
      {/* Ratings List */}
      <RatingsList ratings={ratings} loading={loading} />
      
      {/* Rating Dialog */}
      <RatingDialog
        open={isRatingDialogOpen}
        onOpenChange={setIsRatingDialogOpen}
        interviewerId={interviewer.id}
        interviewerName={`${interviewer.first_name} ${interviewer.last_name}`}
        onSubmit={handleAddRating}
        loading={loading}
      />
    </div>
  );
}
