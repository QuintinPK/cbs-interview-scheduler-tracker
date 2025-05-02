
import { useEvaluationBase } from "./useEvaluationBase";
import { supabase } from "@/integrations/supabase/client";

export const useEvaluationActions = () => {
  const { setLoading, toast } = useEvaluationBase();
  
  const addEvaluation = async (evaluation: {
    interviewer_id: string;
    project_id?: string;
    session_id?: string;
    rating: number;
    remarks?: string;
    tag_ids?: string[];
  }) => {
    try {
      setLoading(true);
      
      // Add the evaluation
      const { data, error } = await supabase
        .from('interviewer_evaluations')
        .insert([{
          interviewer_id: evaluation.interviewer_id,
          project_id: evaluation.project_id,
          session_id: evaluation.session_id,
          rating: evaluation.rating,
          remarks: evaluation.remarks
        }])
        .select();
        
      if (error) throw error;
      
      if (!data || data.length === 0) throw new Error("Failed to create evaluation");
      
      const newEvaluation = data[0];
      
      // Add the tags
      if (evaluation.tag_ids && evaluation.tag_ids.length > 0) {
        const tagJunctions = evaluation.tag_ids.map(tag_id => ({
          evaluation_id: newEvaluation.id,
          tag_id
        }));
        
        const { error: tagsError } = await supabase
          .from('evaluation_tags_junction')
          .insert(tagJunctions);
          
        if (tagsError) throw tagsError;
      }
      
      toast({
        title: "Success",
        description: "Evaluation added successfully",
      });
      
      return newEvaluation;
    } catch (error) {
      console.error("Error adding evaluation:", error);
      toast({
        title: "Error",
        description: "Could not add evaluation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    addEvaluation
  };
};
