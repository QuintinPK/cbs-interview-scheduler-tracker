
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEvaluationBase } from "./useEvaluationBase";
import { Evaluation } from "@/types";

// Define the return type of the RPC function for clarity
interface EvaluationRowData {
  evaluation_id: string;
  interviewer_id: string;
  project_id: string | null;
  session_id: string | null;
  rating: number;
  remarks: string | null;
  created_at: string;
  created_by: string | null;
  tag_id: string | null;
  tag_name: string | null;
  tag_category: string | null;
  tag_created_at: string | null;
}

export const useEvaluationLoader = () => {
  const { setLoading, toast } = useEvaluationBase();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const evaluationsCache = useRef<Record<string, Evaluation[]>>({} as Record<string, Evaluation[]>);
  const lastFetch = useRef<Record<string, number>>({} as Record<string, number>);
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache for better performance
  
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
      
      // Explicitly type the response from the RPC call to resolve TypeScript error
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .rpc('get_interviewer_evaluations_with_tags', { 
          p_interviewer_id: interviewerId 
        }) as { data: EvaluationRowData[] | null, error: any };
        
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
  const processEvaluationsData = (rawData: EvaluationRowData[]) => {
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
