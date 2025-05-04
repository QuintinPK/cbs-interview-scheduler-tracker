
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEvaluationBase } from "./useEvaluationBase";
import { Evaluation } from "@/types";

export const useEvaluationLoader = () => {
  const { setLoading, toast } = useEvaluationBase();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const evaluationsCache = useRef<Record<string, Evaluation[]>>({});
  const lastFetch = useRef<Record<string, number>>({});
  const CACHE_TTL = 5 * 60 * 1000; // Increased to 5 minutes cache for better performance
  
  const loadEvaluationsByInterviewer = useCallback(async (interviewerId: string, forceRefresh = false) => {
    // Return cached data if available and not expired
    const now = Date.now();
    if (
      !forceRefresh && 
      evaluationsCache.current[interviewerId] && 
      lastFetch.current[interviewerId] && 
      (now - lastFetch.current[interviewerId]) < CACHE_TTL
    ) {
      console.log("Using cached evaluations for interviewer:", interviewerId);
      setEvaluations(evaluationsCache.current[interviewerId]);
      return evaluationsCache.current[interviewerId];
    }
    
    try {
      setLoadingEvaluations(true);
      setError(null);
      console.log("Loading evaluations for interviewer:", interviewerId);
      
      // Get evaluations with tags in a single query using RPC (more efficient)
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .rpc('get_interviewer_evaluations_with_tags', { 
          p_interviewer_id: interviewerId 
        });
        
      if (evaluationsError) {
        console.error("Error fetching evaluations:", evaluationsError);
        setEvaluations([]);
        setError("Failed to load evaluations");
        return [];
      }
      
      if (!evaluationsData || evaluationsData.length === 0) {
        console.log("No evaluations found");
        setEvaluations([]);
        // Update cache with empty array
        evaluationsCache.current[interviewerId] = [];
        lastFetch.current[interviewerId] = now;
        return [];
      }
      
      console.log("Found evaluations:", evaluationsData);
      
      // Process the data to group tags by evaluation
      const processedEvaluations = processEvaluationsData(evaluationsData);
      console.log("Processed evaluations:", processedEvaluations);
      
      // Update cache
      evaluationsCache.current[interviewerId] = processedEvaluations;
      lastFetch.current[interviewerId] = now;
      
      setEvaluations(processedEvaluations);
      return processedEvaluations;
    } catch (err) {
      console.error("Error loading evaluations:", err);
      setEvaluations([]);
      setError("Could not load evaluations");
      toast({
        title: "Error",
        description: "Could not load evaluations",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoadingEvaluations(false);
    }
  }, [setError, toast]);
  
  // Helper function to process and group evaluation data
  const processEvaluationsData = (rawData: any[]) => {
    // Create a map to store unique evaluations with their tags
    const evaluationsMap = new Map();
    
    // Process each row from the result
    rawData.forEach(row => {
      const evaluationId = row.evaluation_id;
      
      // If this is the first time we're seeing this evaluation, add it to the map
      if (!evaluationsMap.has(evaluationId)) {
        evaluationsMap.set(evaluationId, {
          id: evaluationId,
          interviewer_id: row.interviewer_id,
          project_id: row.project_id,
          session_id: row.session_id,
          rating: row.rating,
          remarks: row.remarks,
          created_at: row.created_at,
          created_by: row.created_by,
          tags: []
        });
      }
      
      // Add the tag to the evaluation's tags array (if it exists)
      if (row.tag_id) {
        const evaluation = evaluationsMap.get(evaluationId);
        // Check for duplicate tags
        const tagExists = evaluation.tags.some((tag: any) => tag.id === row.tag_id);
        if (!tagExists) {
          evaluation.tags.push({
            id: row.tag_id,
            name: row.tag_name,
            category: row.tag_category,
            created_at: row.tag_created_at
          });
        }
      }
    });
    
    // Convert the map to an array of evaluations
    return Array.from(evaluationsMap.values());
  };

  return {
    evaluations,
    loadingEvaluations,
    error,
    loadEvaluationsByInterviewer
  };
};
