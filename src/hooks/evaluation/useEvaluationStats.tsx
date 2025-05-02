
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useEvaluationStats = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getAverageRating = async (interviewerId: string): Promise<number | null> => {
    try {
      setLoading(true);
      console.log("Getting average rating for interviewer:", interviewerId);
      
      const { data, error } = await supabase
        .from('interviewer_evaluations')
        .select('rating')
        .eq('interviewer_id', interviewerId);
        
      if (error) {
        console.error("Error fetching ratings:", error);
        return null;
      }
      
      if (!data || data.length === 0) {
        console.log("No ratings found");
        return null;
      }
      
      const total = data.reduce((sum, item) => sum + item.rating, 0);
      const average = Number((total / data.length).toFixed(1));
      
      console.log("Average rating:", average);
      return average;
    } catch (error) {
      console.error("Error getting average rating:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAllAverageRatings = async (): Promise<Record<string, number>> => {
    try {
      setLoading(true);
      console.log("Getting all average ratings");
      
      const { data, error } = await supabase
        .from('interviewer_evaluations')
        .select('interviewer_id, rating');
        
      if (error) {
        console.error("Error fetching ratings:", error);
        return {};
      }
      
      if (!data || data.length === 0) {
        console.log("No ratings found");
        return {};
      }
      
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
      
      console.log("All average ratings:", averageRatings);
      return averageRatings;
    } catch (error) {
      console.error("Error getting all average ratings:", error);
      return {};
    } finally {
      setLoading(false);
    }
  };

  return {
    getAverageRating,
    getAllAverageRatings,
    loading
  };
};
