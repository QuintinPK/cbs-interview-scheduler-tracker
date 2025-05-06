
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Define interfaces for our data structures
interface InterviewerRating {
  interviewer_id: string;
  average_rating: number;
}

export const useEvaluationStats = () => {
  const [loading, setLoading] = useState(false);
  
  // Create properly typed refs for caching
  const ratingsCache = useRef<Record<string, number | null>>({});
  const allRatingsCache = useRef<Record<string, number>>({});
  const lastFetch = useRef<Record<string, number>>({});
  
  const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache

  const getAverageRating = useCallback(async (interviewerId: string, forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = `rating_${interviewerId}`;

    if (
      !forceRefresh &&
      ratingsCache.current[cacheKey] !== undefined &&
      lastFetch.current[cacheKey] &&
      now - lastFetch.current[cacheKey] < CACHE_TTL
    ) {
      return ratingsCache.current[cacheKey];
    }

    try {
      setLoading(true);
      console.log(`Getting average rating for interviewer: ${interviewerId}`);

      // Call RPC without type parameters
      const response = await supabase.rpc(
        "get_interviewer_average_rating",
        { interviewer_id_param: interviewerId }
      );

      if (response.error) {
        console.error("Error getting average rating:", response.error);
        return null;
      }

      // Cast the data to the expected type after receiving it
      const avgRating = response.data as number | null;
      
      // Update cache
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
    const now = Date.now();
    const cacheKey = "all_ratings";

    if (
      !forceRefresh &&
      Object.keys(allRatingsCache.current).length > 0 &&
      lastFetch.current[cacheKey] &&
      now - lastFetch.current[cacheKey] < CACHE_TTL
    ) {
      return allRatingsCache.current;
    }

    try {
      setLoading(true);
      console.log("Getting all average ratings");

      // Call RPC without type parameters
      const response = await supabase.rpc(
        "get_all_interviewer_ratings"
      );

      if (response.error) {
        console.error("Error getting all ratings:", response.error);
        return {};
      }

      const ratingsMap: Record<string, number> = {};

      // Process and type check the response data
      if (response.data && Array.isArray(response.data)) {
        (response.data as InterviewerRating[]).forEach((item) => {
          if (item.interviewer_id && typeof item.average_rating === 'number') {
            ratingsMap[item.interviewer_id] = item.average_rating;
          }
        });
      }

      console.log("All average ratings:", ratingsMap);

      // Update cache
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
    getAllAverageRatings,
  };
};
