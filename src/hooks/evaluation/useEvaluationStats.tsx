
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Define proper types for the returned data from Supabase functions
type AverageRatingResult = number | null;
type InterviewerRatingItem = {
  interviewer_id: string;
  average_rating: number;
};

// Define parameter types for RPC functions
type GetAverageRatingParams = {
  interviewer_id_param: string;
};

export const useEvaluationStats = () => {
  const [loading, setLoading] = useState(false);
  
  // Create typesafe refs with proper initialization
  const ratingsCache = useRef<{ [key: string]: number | null }>({});
  const allRatingsCache = useRef<{ [key: string]: number }>({});
  const lastFetch = useRef<{ [key: string]: number }>({});
  
  const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache

  const getAverageRating = useCallback(async (interviewerId: string, forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = `rating_${interviewerId}`;

    if (
      !forceRefresh &&
      cacheKey in ratingsCache.current &&
      cacheKey in lastFetch.current &&
      now - lastFetch.current[cacheKey] < CACHE_TTL
    ) {
      return ratingsCache.current[cacheKey];
    }

    try {
      setLoading(true);

      // Properly type both the params and the return type of the RPC call
      const { data, error } = await supabase.rpc<AverageRatingResult, GetAverageRatingParams>(
        "get_interviewer_average_rating",
        { interviewer_id_param: interviewerId }
      );

      if (error) {
        console.error("Error getting average rating:", error);
        return null;
      }

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
    const now = Date.now();
    const cacheKey = "all_ratings";

    if (
      !forceRefresh &&
      Object.keys(allRatingsCache.current).length > 0 &&
      cacheKey in lastFetch.current &&
      now - lastFetch.current[cacheKey] < CACHE_TTL
    ) {
      return allRatingsCache.current;
    }

    try {
      setLoading(true);
      console.log("Getting all average ratings");

      // Properly type the return type of the RPC call
      const { data, error } = await supabase.rpc<InterviewerRatingItem[]>(
        "get_all_interviewer_ratings"
      );

      if (error) {
        console.error("Error getting all ratings:", error);
        return {};
      }

      const ratingsMap: { [key: string]: number } = {};

      if (data && Array.isArray(data)) {
        (data as InterviewerRatingItem[]).forEach((item) => {
          if (item.interviewer_id && item.average_rating !== null) {
            ratingsMap[item.interviewer_id] = item.average_rating;
          }
        });
      }

      console.log("All average ratings:", ratingsMap);

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
