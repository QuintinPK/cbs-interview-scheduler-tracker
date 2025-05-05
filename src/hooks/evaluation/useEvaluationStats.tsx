
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EvaluationStats {
  averageRating: number;
  totalEvaluations: number;
  topTags: { name: string; count: number }[];
  ratingDistribution: Record<number, number>;
}

export const useEvaluationStats = (interviewerId: string | undefined) => {
  const [stats, setStats] = useState<EvaluationStats>({
    averageRating: 0,
    totalEvaluations: 0,
    topTags: [],
    ratingDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ratingsCache = useRef<Record<string, number>>({});
  const lastFetch = useRef<Record<string, number>>({});
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  
  const calculateStats = useCallback(async (interviewerId: string, forceRefresh = false) => {
    if (!interviewerId) return;
    
    // Return cached data if available and not expired
    const now = Date.now();
    if (!forceRefresh && ratingsCache.current[interviewerId] !== undefined && 
        lastFetch.current[interviewerId] && 
        (now - lastFetch.current[interviewerId]) < CACHE_TTL) {
      return {
        averageRating: ratingsCache.current[interviewerId]
      };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all evaluations for this interviewer
      const { data: evaluations, error: evalError } = await supabase
        .from('interviewer_evaluations')
        .select('*')
        .eq('interviewer_id', interviewerId);
        
      if (evalError) throw evalError;
      
      // If no evaluations, return default stats
      if (!evaluations || evaluations.length === 0) {
        setStats({
          averageRating: 0,
          totalEvaluations: 0,
          topTags: [],
          ratingDistribution: {}
        });
        
        ratingsCache.current[interviewerId] = 0;
        lastFetch.current[interviewerId] = now;
        
        return {
          averageRating: 0
        };
      }
      
      // Calculate average rating
      const sum = evaluations.reduce((acc, eval_) => acc + eval_.rating, 0);
      const average = sum / evaluations.length;
      
      // Calculate rating distribution
      const distribution: Record<number, number> = {};
      evaluations.forEach(eval_ => {
        distribution[eval_.rating] = (distribution[eval_.rating] || 0) + 1;
      });
      
      // Fetch all tags for these evaluations
      const evaluationIds = evaluations.map(e => e.id);
      
      const { data: tagsJunction, error: tagsError } = await supabase
        .from('evaluation_tags_junction')
        .select(`
          tag_id,
          evaluation_tags:tag_id (
            name
          )
        `)
        .in('evaluation_id', evaluationIds);
        
      if (tagsError) throw tagsError;
      
      // Count tag occurrences
      const tagCounts: Record<string, { name: string; count: number }> = {};
      
      tagsJunction?.forEach((junction: any) => {
        if (junction.evaluation_tags && junction.evaluation_tags.name) {
          const tagName = junction.evaluation_tags.name;
          if (!tagCounts[tagName]) {
            tagCounts[tagName] = { name: tagName, count: 0 };
          }
          tagCounts[tagName].count += 1;
        }
      });
      
      // Get top tags
      const sortedTags = Object.values(tagCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const newStats = {
        averageRating: parseFloat(average.toFixed(1)),
        totalEvaluations: evaluations.length,
        topTags: sortedTags,
        ratingDistribution: distribution
      };
      
      setStats(newStats);
      
      // Update cache
      ratingsCache.current[interviewerId] = newStats.averageRating;
      lastFetch.current[interviewerId] = now;
      
      return {
        averageRating: newStats.averageRating
      };
      
    } catch (err) {
      console.error("Error calculating evaluation stats:", err);
      setError("Failed to load evaluation statistics");
      return {
        averageRating: 0
      };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (interviewerId) {
      calculateStats(interviewerId);
    }
  }, [interviewerId, calculateStats]);
  
  // Get average rating for a specific interviewer
  const getAverageRating = useCallback(async (interviewerId: string, forceRefresh = false) => {
    const result = await calculateStats(interviewerId, forceRefresh);
    return result.averageRating;
  }, [calculateStats]);
  
  // Get all average ratings 
  const getAllAverageRatings = useCallback(async (forceRefresh = false) => {
    try {
      // Return cached data if available and not expired
      const now = Date.now();
      if (!forceRefresh && Object.keys(ratingsCache.current).length > 0) {
        // Check if any of the cached values is expired
        const isExpired = Object.keys(lastFetch.current).some(
          key => (now - lastFetch.current[key]) >= CACHE_TTL
        );
        
        if (!isExpired) {
          return ratingsCache.current;
        }
      }
      
      setLoading(true);
      
      // Fetch all evaluations grouped by interviewer
      const { data: aggregateData, error: aggregateError } = await supabase
        .from('interviewer_evaluations')
        .select('interviewer_id, rating');
        
      if (aggregateError) throw aggregateError;
      
      // Calculate average rating for each interviewer
      const interviewerRatings: Record<string, number[]> = {};
      
      aggregateData?.forEach((evaluation) => {
        if (!interviewerRatings[evaluation.interviewer_id]) {
          interviewerRatings[evaluation.interviewer_id] = [];
        }
        interviewerRatings[evaluation.interviewer_id].push(evaluation.rating);
      });
      
      const averageRatings: Record<string, number> = {};
      
      Object.keys(interviewerRatings).forEach((interviewerId) => {
        const ratings = interviewerRatings[interviewerId];
        const sum = ratings.reduce((acc, rating) => acc + rating, 0);
        const average = parseFloat((sum / ratings.length).toFixed(1));
        averageRatings[interviewerId] = average;
        
        // Update cache
        ratingsCache.current[interviewerId] = average;
        lastFetch.current[interviewerId] = now;
      });
      
      return averageRatings;
    } catch (err) {
      console.error("Error fetching all average ratings:", err);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { 
    stats, 
    loading, 
    error,
    getAverageRating,
    getAllAverageRatings
  };
};
