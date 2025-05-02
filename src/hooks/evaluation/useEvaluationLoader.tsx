
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
      console.log("Loading evaluations for interviewer:", interviewerId);
      
      // Get evaluations
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('interviewer_evaluations')
        .select('*')
        .eq('interviewer_id', interviewerId)
        .order('created_at', { ascending: false });
        
      if (evaluationsError) {
        console.error("Error fetching evaluations:", evaluationsError);
        throw evaluationsError;
      }
      
      console.log("Found evaluations:", evaluationsData);
      
      // Get tags for each evaluation
      const evaluationsWithTags = await Promise.all(
        (evaluationsData || []).map(async (evaluation) => {
          console.log("Getting tags for evaluation:", evaluation.id);
          
          const { data: tagsData, error: tagsError } = await supabase
            .from('evaluation_tags_junction')
            .select('tag_id')
            .eq('evaluation_id', evaluation.id);
            
          if (tagsError) {
            console.error("Error fetching tag junctions:", tagsError);
            throw tagsError;
          }
          
          console.log("Found tag junctions:", tagsData);
          
          if (tagsData && tagsData.length > 0) {
            const tagIds = tagsData.map(t => t.tag_id);
            console.log("Tag IDs:", tagIds);
            
            const { data: tagDetails, error: tagDetailsError } = await supabase
              .from('evaluation_tags')
              .select('*')
              .in('id', tagIds);
              
            if (tagDetailsError) {
              console.error("Error fetching tag details:", tagDetailsError);
              throw tagDetailsError;
            }
            
            console.log("Found tag details:", tagDetails);
            
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
      
      console.log("Evaluations with tags:", evaluationsWithTags);
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
