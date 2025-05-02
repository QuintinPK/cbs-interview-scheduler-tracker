
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEvaluationBase } from "./useEvaluationBase";
import { Evaluation } from "@/types";

export const useEvaluationLoader = () => {
  const { setLoading, toast } = useEvaluationBase();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadEvaluationsByInterviewer = async (interviewerId: string) => {
    try {
      setLoadingEvaluations(true);
      setLoading(true);
      setError(null);
      console.log("Loading evaluations for interviewer:", interviewerId);
      
      // Get evaluations
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('interviewer_evaluations')
        .select('*')
        .eq('interviewer_id', interviewerId)
        .order('created_at', { ascending: false });
        
      if (evaluationsError) {
        console.error("Error fetching evaluations:", evaluationsError);
        setEvaluations([]);
        setError("Failed to load evaluations");
        return;
      }
      
      if (!evaluationsData || evaluationsData.length === 0) {
        console.log("No evaluations found");
        setEvaluations([]);
        return;
      }
      
      console.log("Found evaluations:", evaluationsData);
      
      // Get tags for each evaluation
      try {
        const evaluationsWithTags = await Promise.all(
          evaluationsData.map(async (evaluation) => {
            console.log("Getting tags for evaluation:", evaluation.id);
            
            const { data: tagsData, error: tagsError } = await supabase
              .from('evaluation_tags_junction')
              .select('tag_id')
              .eq('evaluation_id', evaluation.id);
              
            if (tagsError) {
              console.error("Error fetching tag junctions:", tagsError);
              return { ...evaluation, tags: [] };
            }
            
            if (!tagsData || tagsData.length === 0) {
              return { ...evaluation, tags: [] };
            }
            
            console.log("Found tag junctions:", tagsData);
            
            const tagIds = tagsData.map(t => t.tag_id);
            console.log("Tag IDs:", tagIds);
            
            const { data: tagDetails, error: tagDetailsError } = await supabase
              .from('evaluation_tags')
              .select('*')
              .in('id', tagIds);
              
            if (tagDetailsError) {
              console.error("Error fetching tag details:", tagDetailsError);
              return { ...evaluation, tags: [] };
            }
            
            console.log("Found tag details:", tagDetails);
            
            return {
              ...evaluation,
              tags: tagDetails || []
            };
          })
        );
        
        console.log("Evaluations with tags:", evaluationsWithTags);
        setEvaluations(evaluationsWithTags);
      } catch (err) {
        console.error("Error processing evaluations:", err);
        setEvaluations(evaluationsData.map(evaluation => ({ ...evaluation, tags: [] })));
        setError("Error loading evaluation tags");
      }
    } catch (err) {
      console.error("Error loading evaluations:", err);
      setEvaluations([]);
      setError("Could not load evaluations");
      toast({
        title: "Error",
        description: "Could not load evaluations",
        variant: "destructive",
      });
    } finally {
      setLoadingEvaluations(false);
      setLoading(false);
    }
  };

  return {
    evaluations,
    loadingEvaluations,
    error,
    loadEvaluationsByInterviewer
  };
};
