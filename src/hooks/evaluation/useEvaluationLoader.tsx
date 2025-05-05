
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEvaluationBase } from "@/hooks/useEvaluationBase";

export const useEvaluationLoader = (interviewerId: string | undefined) => {
  const { toast, loading: baseLoading, setLoading, error, setError } = useEvaluationBase();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [evaluationTags, setEvaluationTags] = useState<Record<string, string[]>>({});
  const [loading, setInternalLoading] = useState(false);
  
  const loadEvaluationsByInterviewer = useCallback(async (interviewerId: string, forceRefresh = false) => {
    if (!interviewerId) return [];
    
    try {
      setInternalLoading(true);
      setLoading(true);
      setError(null);
      
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
        
      if (evaluationsError) throw evaluationsError;
      
      // If no evaluations, return empty array
      if (!evaluationsData || evaluationsData.length === 0) {
        setEvaluations([]);
        setEvaluationTags({});
        return [];
      }
      
      setEvaluations(evaluationsData);
      
      // Now fetch all tags for these evaluations
      const evaluationIds = evaluationsData.map(e => e.id);
      
      const { data: tagsJunctionData, error: tagsError } = await supabase
        .from('evaluation_tags_junction')
        .select(`
          evaluation_id,
          tag_id,
          evaluation_tags:tag_id (
            name
          )
        `)
        .in('evaluation_id', evaluationIds);
        
      if (tagsError) throw tagsError;
      
      // Group tags by evaluation ID
      const tagsMap: Record<string, string[]> = {};
      
      tagsJunctionData?.forEach((junction: any) => {
        if (!tagsMap[junction.evaluation_id]) {
          tagsMap[junction.evaluation_id] = [];
        }
        
        if (junction.evaluation_tags && junction.evaluation_tags.name) {
          tagsMap[junction.evaluation_id].push(junction.evaluation_tags.name);
        }
      });
      
      setEvaluationTags(tagsMap);
      return evaluationsData;
      
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
