
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InterviewerRating, RatingStats } from '@/types/evaluation';

export function useInterviewerRatings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<InterviewerRating[]>([]);
  const [stats, setStats] = useState<RatingStats>({ average: 0, count: 0 });

  const fetchRatings = useCallback(async (interviewerId: string) => {
    setLoading(true);
    try {
      // Get ratings for an interviewer
      const { data, error } = await supabase
        .from('interviewer_ratings')
        .select('*')
        .eq('interviewer_id', interviewerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Format the data to match our types
      const formattedRatings: InterviewerRating[] = data.map(rating => ({
        id: rating.id,
        interviewerId: rating.interviewer_id,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.created_at,
        createdBy: rating.created_by || 'Anonymous'
      }));
      
      setRatings(formattedRatings);
      
      // Calculate stats if we have ratings
      if (formattedRatings.length > 0) {
        const total = formattedRatings.reduce((sum, rating) => sum + rating.score, 0);
        setStats({
          average: parseFloat((total / formattedRatings.length).toFixed(1)),
          count: formattedRatings.length
        });
      } else {
        setStats({ average: 0, count: 0 });
      }
      
      return formattedRatings;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interviewer ratings',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addRating = useCallback(async (interviewerId: string, score: number, comment?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interviewer_ratings')
        .insert([{
          interviewer_id: interviewerId,
          score,
          comment,
          created_by: (await supabase.auth.getUser()).data.user?.email
        }])
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Rating submitted successfully'
      });
      
      // Refresh ratings
      fetchRatings(interviewerId);
      
      return true;
    } catch (error) {
      console.error('Error adding rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchRatings]);

  return {
    ratings,
    stats,
    loading,
    fetchRatings,
    addRating
  };
}
