
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { Loader2, Star, Plus } from 'lucide-react';
import { RatingStats } from '@/types/evaluation';

interface RatingsSummaryProps {
  stats: RatingStats;
  loading: boolean;
  onAddRating: () => void;
}

export function RatingsSummary({ stats, loading, onAddRating }: RatingsSummaryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Interviewer Rating</CardTitle>
        <Button size="sm" onClick={onAddRating}>
          <Plus className="h-4 w-4 mr-1" /> Add Rating
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats.count > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 justify-center">
              <StarRating rating={stats.average} readOnly size={32} />
              <span className="text-2xl font-bold">{stats.average}</span>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Based on {stats.count} rating{stats.count !== 1 ? 's' : ''}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No ratings yet</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              Be the first to rate this interviewer
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
