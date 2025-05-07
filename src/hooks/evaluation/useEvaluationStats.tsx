
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
  const hasEvaluationsCache = useRef<Record<string, boolean>>({});
  
  const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache

  // Helper function to check if interviewer has any evaluations (fast path)
  const checkIfEvaluationsExist = useCallback(async (interviewerId: string): Promise<boolean> => {
    // Return from cache if available
    if (hasEvaluationsCache.current[interviewerId] !== undefined) {
      return hasEvaluationsCache.current[interviewerId];
    }
    
    try {
      const { count, error } = await supabase
        .from('interviewer_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('interviewer_id', interviewerId);
      
      const hasEvaluations = count !== null && count > 0;
      hasEvaluationsCache.current[interviewerId] = hasEvaluations;
      
      return hasEvaluations;
    } catch (error) {
      console.error("Error checking if evaluations exist:", error);
      return false;
    }
  }, []);

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
      
      // Fast path: check if interviewer has any evaluations first
      const hasEvaluations = await checkIfEvaluationsExist(interviewerId);
      if (!hasEvaluations) {
        console.log(`No evaluations found for interviewer: ${interviewerId}, skipping average calculation`);
        ratingsCache.current[cacheKey] = null;
        lastFetch.current[cacheKey] = now;
        return null;
      }

      // Use the PostgreSQL function to calculate average rating
      const { data, error } = await supabase.rpc(
        "get_interviewer_average_rating",
        { interviewer_id_param: interviewerId }
      );

      if (error) {
        console.error("Error getting average rating:", error);
        return null;
      }

      // Cast the data to the expected type after receiving it
      const avgRating = data as number | null;
      
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
  }, [checkIfEvaluationsExist]);

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

      // Use the PostgreSQL function to get all ratings at once
      const { data, error } = await supabase.rpc("get_all_interviewer_ratings");

      if (error) {
        console.error("Error getting all ratings:", error);
        return {};
      }

      const ratingsMap: Record<string, number> = {};

      // Process and type check the response data
      if (data && Array.isArray(data)) {
        (data as InterviewerRating[]).forEach((item) => {
          if (item.interviewer_id && typeof item.average_rating === 'number') {
            ratingsMap[item.interviewer_id] = item.average_rating;
          }
        });
      }

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
