
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEvaluationBase } from "./useEvaluationBase";
import { Evaluation, EvaluationTag } from "@/types";

export const useEvaluationLoader = () => {
  const { setLoading, toast } = useEvaluationBase();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fix the ref typing by using the same pattern
  const evaluationsCache = useRef<Record<string, Evaluation[]>>({} as Record<string, Evaluation[]>);
  const lastFetch = useRef<Record<string, number>>({} as Record<string, number>);
  const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache
  
  const loadEvaluationsByInterviewer = useCallback(async (interviewerId: string, forceRefresh = false) => {
    // Return cached data if available, not expired, and not force refreshing
    const now = Date.now();
    if (
      !forceRefresh && 
      evaluationsCache.current[interviewerId] && 
      lastFetch.current[interviewerId] && 
      (now - lastFetch.current[interviewerId]) < CACHE_TTL
    ) {
      const cachedEvals = evaluationsCache.current[interviewerId];
      setEvaluations(cachedEvals);
      return cachedEvals;
    }
    
    try {
      setLoadingEvaluations(true);
      setError(null);
      console.log(`Loading evaluations for interviewer: ${interviewerId} (force refresh: ${forceRefresh})`);
      
      // First check if there are any evaluations at all (fast path)
      const { count, error: countError } = await supabase
        .from('interviewer_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('interviewer_id', interviewerId);
        
      if (countError) {
        console.error("Error counting evaluations:", countError);
        throw countError;
      }
      
      // If no evaluations, return empty array immediately
      if (count === 0) {
        console.log("No evaluations found for this interviewer");
        setEvaluations([]);
        
        // Update cache with empty array
        evaluationsCache.current[interviewerId] = [];
        lastFetch.current[interviewerId] = now;
        return [];
      }
      
      // If we have evaluations, get them with a single query
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('interviewer_evaluations')
        .select('*')
        .eq('interviewer_id', interviewerId)
        .order('created_at', { ascending: false });
        
      if (evaluationsError) {
        console.error("Error fetching evaluations:", evaluationsError);
        setEvaluations([]);
        setError("Failed to load evaluations");
        return [];
      }
      
      if (!evaluationsData || evaluationsData.length === 0) {
        console.log("No evaluations found after full query");
        setEvaluations([]);
        // Update cache with empty array
        evaluationsCache.current[interviewerId] = [];
        lastFetch.current[interviewerId] = now;
        return [];
      }
      
      console.log(`Found ${evaluationsData.length} evaluations`);
      
      // Get all evaluation IDs for batch fetching tags
      const evaluationIds = evaluationsData.map(evaluation => evaluation.id);
      
      // Fetch all tags for these evaluations in a single query with proper joins
      const { data: tagJunctionsWithTags, error: tagsError } = await supabase
        .from('evaluation_tags_junction')
        .select(`
          evaluation_id,
          tag_id,
          evaluation_tags(*)
        `)
        .in('evaluation_id', evaluationIds);
        
      if (tagsError) {
        console.error("Error fetching evaluation tags:", tagsError);
        // Continue with evaluations but without tags
        const evaluationsWithoutTags = evaluationsData.map(evaluation => ({
          ...evaluation,
          tags: []
        }));
        
        setEvaluations(evaluationsWithoutTags);
        evaluationsCache.current[interviewerId] = evaluationsWithoutTags;
        lastFetch.current[interviewerId] = now;
        return evaluationsWithoutTags;
      }
      
      // Process and organize tags by evaluation ID
      const tagsByEvaluation: Record<string, EvaluationTag[]> = {};
      
      tagJunctionsWithTags?.forEach(junction => {
        const evaluationId = junction.evaluation_id;
        const tag = junction.evaluation_tags;
        
        if (!tagsByEvaluation[evaluationId]) {
          tagsByEvaluation[evaluationId] = [];
        }
        
        if (tag) {
          tagsByEvaluation[evaluationId].push(tag as EvaluationTag);
        }
      });
      
      // Combine evaluations with their tags
      const evaluationsWithTags = evaluationsData.map(evaluation => ({
        ...evaluation,
        tags: tagsByEvaluation[evaluation.id] || []
      }));
      
      // Update cache
      evaluationsCache.current[interviewerId] = evaluationsWithTags;
      lastFetch.current[interviewerId] = now;
      
      // Update state
      setEvaluations(evaluationsWithTags);
      console.log(`Processed ${evaluationsWithTags.length} evaluations with their tags`);
      return evaluationsWithTags;
      
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

  return {
    evaluations,
    loadingEvaluations,
    error,
    loadEvaluationsByInterviewer
  };
};
