
import { supabase } from "@/integrations/supabase/client";

export const useEvaluationStats = () => {
  const getAverageRating = async (interviewerId: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('interviewer_evaluations')
        .select('rating')
        .eq('interviewer_id', interviewerId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      const total = data.reduce((sum, item) => sum + item.rating, 0);
      return Number((total / data.length).toFixed(1));
    } catch (error) {
      console.error("Error getting average rating:", error);
      return null;
    }
  };

  const getAllAverageRatings = async (): Promise<Record<string, number>> => {
    try {
      const { data, error } = await supabase
        .from('interviewer_evaluations')
        .select('interviewer_id, rating');
        
      if (error) throw error;
      
      if (!data || data.length === 0) return {};
      
      // Group evaluations by interviewer and calculate averages
      const ratingsByInterviewer: Record<string, number[]> = {};
      
      data.forEach(evaluation => {
        if (!ratingsByInterviewer[evaluation.interviewer_id]) {
          ratingsByInterviewer[evaluation.interviewer_id] = [];
        }
        ratingsByInterviewer[evaluation.interviewer_id].push(evaluation.rating);
      });
      
      const averageRatings: Record<string, number> = {};
      
      Object.entries(ratingsByInterviewer).forEach(([interviewerId, ratings]) => {
        const total = ratings.reduce((sum, rating) => sum + rating, 0);
        averageRatings[interviewerId] = Number((total / ratings.length).toFixed(1));
      });
      
      return averageRatings;
    } catch (error) {
      console.error("Error getting all average ratings:", error);
      return {};
    }
  };

  return {
    getAverageRating,
    getAllAverageRatings
  };
};
