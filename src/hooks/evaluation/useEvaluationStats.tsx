
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useEvaluationStats = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const ratingsCache = useRef<Record<string, number>>({});
  const allRatingsCache = useRef<Record<string, number> | null>(null);
  const cacheTimestamp = useRef<Record<string, number>>({});
  const allCacheTimestamp = useRef<number>(0);
  const CACHE_DURATION = 60000; // 1 minute cache

  // Clear cache when component unmounts or after cache duration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Clear individual ratings cache if expired
      Object.keys(cacheTimestamp.current).forEach(key => {
        if (now - cacheTimestamp.current[key] > CACHE_DURATION) {
          delete ratingsCache.current[key];
          delete cacheTimestamp.current[key];
        }
      });
      
      // Clear all ratings cache if expired
      if (now - allCacheTimestamp.current > CACHE_DURATION) {
        allRatingsCache.current = null;
      }
    }, CACHE_DURATION);
    
    return () => clearInterval(interval);
  }, []);

  const getAverageRating = useCallback(async (interviewerId: string, forceRefresh = false): Promise<number | null> => {
    // Use cached value if available and not forcing refresh
    if (!forceRefresh && ratingsCache.current[interviewerId]) {
      return ratingsCache.current[interviewerId];
    }

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
      
      // Cache the result
      ratingsCache.current[interviewerId] = average;
      cacheTimestamp.current[interviewerId] = Date.now();
      
      console.log("Average rating:", average);
      return average;
    } catch (error) {
      console.error("Error getting average rating:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllAverageRatings = useCallback(async (forceRefresh = false): Promise<Record<string, number>> => {
    // Return cached ratings if available and not forcing refresh
    if (!forceRefresh && allRatingsCache.current !== null) {
      return allRatingsCache.current;
    }
    
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
      
      // Update both caches
      allRatingsCache.current = averageRatings;
      
      // Update individual caches
      Object.entries(averageRatings).forEach(([interviewerId, rating]) => {
        ratingsCache.current[interviewerId] = rating;
        cacheTimestamp.current[interviewerId] = Date.now();
      });
      
      allCacheTimestamp.current = Date.now();
      
      console.log("All average ratings:", averageRatings);
      return averageRatings;
    } catch (error) {
      console.error("Error getting all average ratings:", error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getAverageRating,
    getAllAverageRatings,
    loading
  };
};
