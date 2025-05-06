
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type AverageRatingResult = number | null;
type AllRatingsResult = Record<string, number>;
type InterviewerRatingItem = {
  interviewer_id: string;
  average_rating: number;
};

export const useEvaluationStats = () => {
  const [loading, setLoading] = useState(false);
  const ratingsCache = useRef<Record<string, number | null>>({});
  const allRatingsCache = useRef<Record<string, number>>({});
  const lastFetch = useRef<Record<string, number>>({});
  const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache
  
  const getAverageRating = useCallback(async (interviewerId: string, forceRefresh = false) => {
    // Return cached data if available and not expired
    const now = Date.now();
    const cacheKey = `rating_${interviewerId}`;
    
    if (
      !forceRefresh && 
      ratingsCache.current[cacheKey] !== undefined && 
      lastFetch.current[cacheKey] && 
      (now - lastFetch.current[cacheKey]) < CACHE_TTL
    ) {
      return ratingsCache.current[cacheKey];
    }
    
    try {
      setLoading(true);
      
      // Use a more efficient direct average calculation in the database
      const { data, error } = await supabase
        .rpc('get_interviewer_average_rating', { interviewer_id_param: interviewerId });
      
      if (error) {
        console.error("Error getting average rating:", error);
        return null;
      }
      
      // Store in cache
      const avgRating = data as AverageRatingResult;
      ratingsCache.current[cacheKey] = avgRating;
      lastFetch.current[cacheKey] = now;
      
      return avgRating;
    } catch (error) {
      console.error("Error in getAverageRating:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const getAllAverageRatings = useCallback(async (forceRefresh = false) => {
    // Return cached data if available and not expired
    const now = Date.now();
    const cacheKey = 'all_ratings';
    
    if (
      !forceRefresh && 
      Object.keys(allRatingsCache.current).length > 0 && 
      lastFetch.current[cacheKey] && 
      (now - lastFetch.current[cacheKey]) < CACHE_TTL
    ) {
      return allRatingsCache.current;
    }
    
    try {
      setLoading(true);
      console.log("Getting all average ratings");
      
      // Use an optimized query to get all ratings in a single call
      const { data, error } = await supabase
        .rpc('get_all_interviewer_ratings');
      
      if (error) {
        console.error("Error getting all ratings:", error);
        return {};
      }
      
      // Process data into a map of interviewer_id -> rating
      const ratingsMap: Record<string, number> = {};
      
      if (data && Array.isArray(data)) {
        (data as InterviewerRatingItem[]).forEach((item) => {
          if (item.interviewer_id && item.average_rating !== null) {
            ratingsMap[item.interviewer_id] = item.average_rating;
          }
        });
      }
      
      console.log("All average ratings:", ratingsMap);
      
      // Store in cache
      allRatingsCache.current = ratingsMap;
      lastFetch.current[cacheKey] = now;
      
      return ratingsMap;
    } catch (error) {
      console.error("Error in getAllAverageRatings:", error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    loading,
    getAverageRating,
    getAllAverageRatings
  };
};
