
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEvaluationBase } from "./useEvaluationBase";
import { Evaluation } from "@/types";

export const useEvaluationLoader = () => {
  const { setLoading, toast } = useEvaluationBase();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  
  const loadEvaluationsByInterviewer = async (interviewerId: string) => {
    try {
      setLoading(true);
      
      // Get evaluations
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('interviewer_evaluations')
        .select('*')
        .eq('interviewer_id', interviewerId)
        .order('created_at', { ascending: false });
        
      if (evaluationsError) throw evaluationsError;
      
      // Get tags for each evaluation
      const evaluationsWithTags = await Promise.all(
        (evaluationsData || []).map(async (evaluation) => {
          const { data: tagsData, error: tagsError } = await supabase
            .from('evaluation_tags_junction')
            .select('tag_id')
            .eq('evaluation_id', evaluation.id);
            
          if (tagsError) throw tagsError;
          
          if (tagsData && tagsData.length > 0) {
            const tagIds = tagsData.map(t => t.tag_id);
            
            const { data: tagDetails, error: tagDetailsError } = await supabase
              .from('evaluation_tags')
              .select('*')
              .in('id', tagIds);
              
            if (tagDetailsError) throw tagDetailsError;
            
            return {
              ...evaluation,
              tags: tagDetails || []
            };
          }
          
          return {
            ...evaluation,
            tags: []
          };
        })
      );
      
      setEvaluations(evaluationsWithTags);
    } catch (error) {
      console.error("Error loading evaluations:", error);
      toast({
        title: "Error",
        description: "Could not load evaluations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    evaluations,
    loadEvaluationsByInterviewer
  };
};
