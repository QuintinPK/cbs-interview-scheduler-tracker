
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEvaluationBase } from "./useEvaluationBase";
import { Evaluation } from "@/types";

export const useEvaluationLoader = (interviewerId: string | undefined) => {
  const { toast } = useToast();
  const { loading: baseLoading, setLoading, error, setError } = useEvaluationBase();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evaluationTags, setEvaluationTags] = useState<Record<string, string[]>>({});
  const [loading, setInternalLoading] = useState(false);
  
  const loadEvaluationsByInterviewer = useCallback(async (interviewerId: string, forceRefresh = false) => {
    if (!interviewerId) return [];
    
    try {
      setInternalLoading(true);
      setLoading(true);
      setError(null);
      
      console.log("Loading evaluations for interviewer:", interviewerId);
      
      // Fetch evaluations for this interviewer
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('interviewer_evaluations')
        .select(`
          *,
          projects:project_id (
            name
          )
        `)
        .eq('interviewer_id', interviewerId)
        .order('created_at', { ascending: false });
        
      if (evaluationsError) {
        console.error("Error fetching evaluations:", evaluationsError);
        throw evaluationsError;
      }
      
      console.log("Loaded evaluations:", evaluationsData);
      
      // If no evaluations, return empty array
      if (!evaluationsData || evaluationsData.length === 0) {
        setEvaluations([]);
        setEvaluationTags({});
        return [];
      }
      
      // Process evaluations to match expected structure
      const processedEvaluations = evaluationsData.map(evaluation => ({
        ...evaluation,
        tags: [] // Initialize empty tags array that will be populated later
      }));
      
      setEvaluations(processedEvaluations);
      
      // Now fetch all tags for these evaluations
      const evaluationIds = evaluationsData.map(e => e.id);
      
      const { data: tagsJunctionData, error: tagsError } = await supabase
        .from('evaluation_tags_junction')
        .select(`
          evaluation_id,
          tag_id,
          evaluation_tags:tag_id (
            id,
            name,
            category
          )
        `)
        .in('evaluation_id', evaluationIds);
        
      if (tagsError) {
        console.error("Error fetching evaluation tags:", tagsError);
        throw tagsError;
      }
      
      console.log("Loaded tags junction data:", tagsJunctionData);
      
      // Group tags by evaluation ID
      const tagsMap: Record<string, string[]> = {};
      
      // Also create a structure for the full tag objects to add to the evaluations
      const evaluationTagsMap: Record<string, any[]> = {};
      
      tagsJunctionData?.forEach((junction: any) => {
        if (!tagsMap[junction.evaluation_id]) {
          tagsMap[junction.evaluation_id] = [];
          evaluationTagsMap[junction.evaluation_id] = [];
        }
        
        if (junction.evaluation_tags && junction.evaluation_tags.name) {
          tagsMap[junction.evaluation_id].push(junction.evaluation_tags.name);
          evaluationTagsMap[junction.evaluation_id].push({
            id: junction.tag_id,
            name: junction.evaluation_tags.name,
            category: junction.evaluation_tags.category
          });
        }
      });
      
      setEvaluationTags(tagsMap);
      
      // Add tags to each evaluation
      const evaluationsWithTags = processedEvaluations.map(evaluation => ({
        ...evaluation,
        tags: evaluationTagsMap[evaluation.id] || []
      }));
      
      setEvaluations(evaluationsWithTags);
      
      console.log("Final evaluations with tags:", evaluationsWithTags);
      
      return evaluationsWithTags;
      
    } catch (err: any) {
      console.error("Error loading evaluations:", err);
      setError("Failed to load evaluations");
      toast({
        title: "Error",
        description: "Failed to load evaluations",
        variant: "destructive",
      });
      return [];
    } finally {
      setInternalLoading(false);
      setLoading(false);
    }
  }, [setLoading, setError, toast]);
  
  useEffect(() => {
    if (interviewerId) {
      loadEvaluationsByInterviewer(interviewerId);
    }
  }, [interviewerId, loadEvaluationsByInterviewer]);
  
  return {
    evaluations,
    evaluationTags,
    loading: baseLoading || loading,
    loadingEvaluations: loading,
    error,
    loadEvaluationsByInterviewer
  };
};
