
import { useState } from "react";
import { useEvaluationBase } from "./useEvaluationBase";
import { supabase } from "@/integrations/supabase/client";

export const useEvaluationActions = () => {
  const { setLoading, toast } = useEvaluationBase();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const addEvaluation = async (evaluation: {
    interviewer_id: string;
    project_id?: string;
    session_id?: string;
    rating: number;
    remarks?: string;
    tag_ids?: string[];
  }) => {
    try {
      setSaving(true);
      setLoading(true);
      setError(null);
      
      console.log("Adding evaluation:", evaluation);
      
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
        
      if (error) {
        console.error("Error inserting evaluation:", error);
        setError("Failed to create evaluation");
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error("Failed to create evaluation, no data returned");
        setError("Failed to create evaluation");
        throw new Error("Failed to create evaluation");
      }
      
      const newEvaluation = data[0];
      console.log("Created evaluation:", newEvaluation);
      
      // Add the tags
      if (evaluation.tag_ids && evaluation.tag_ids.length > 0) {
        const tagJunctions = evaluation.tag_ids.map(tag_id => ({
          evaluation_id: newEvaluation.id,
          tag_id
        }));
        
        console.log("Adding tag junctions:", tagJunctions);
        
        const { error: tagsError } = await supabase
          .from('evaluation_tags_junction')
          .insert(tagJunctions);
          
        if (tagsError) {
          console.error("Error inserting tag junctions:", tagsError);
          // We don't throw here to allow evaluation to be saved even if tags fail
          setError("Evaluation saved but failed to link tags");
          toast({
            title: "Warning",
            description: "Evaluation saved but tags could not be added",
            variant: "default",
          });
          return newEvaluation;
        }
      }
      
      toast({
        title: "Success",
        description: "Evaluation added successfully",
      });
      
      return newEvaluation;
    } catch (err) {
      console.error("Error adding evaluation:", err);
      toast({
        title: "Error",
        description: "Could not add evaluation",
        variant: "destructive",
      });
      throw err;
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const updateEvaluation = async (id: string, evaluation: {
    rating?: number;
    remarks?: string;
    project_id?: string;
    session_id?: string;
    tag_ids?: string[];
  }) => {
    try {
      setSaving(true);
      setLoading(true);
      setError(null);
      
      // Update the evaluation
      const { data, error } = await supabase
        .from('interviewer_evaluations')
        .update({
          rating: evaluation.rating,
          remarks: evaluation.remarks,
          project_id: evaluation.project_id,
          session_id: evaluation.session_id
        })
        .eq('id', id)
        .select();
        
      if (error) {
        console.error("Error updating evaluation:", error);
        setError("Failed to update evaluation");
        throw error;
      }
      
      // If tag_ids are provided, update the tags
      if (evaluation.tag_ids !== undefined) {
        try {
          // First delete existing tags
          const { error: deleteError } = await supabase
            .from('evaluation_tags_junction')
            .delete()
            .eq('evaluation_id', id);
            
          if (deleteError) {
            console.error("Error deleting tags:", deleteError);
            setError("Evaluation updated but failed to update tags");
            return data && data.length > 0 ? data[0] : null;
          }
          
          // Then add new tags if any
          if (evaluation.tag_ids.length > 0) {
            const tagJunctions = evaluation.tag_ids.map(tag_id => ({
              evaluation_id: id,
              tag_id
            }));
            
            const { error: insertError } = await supabase
              .from('evaluation_tags_junction')
              .insert(tagJunctions);
              
            if (insertError) {
              console.error("Error inserting new tags:", insertError);
              setError("Evaluation updated but failed to add new tags");
              return data && data.length > 0 ? data[0] : null;
            }
          }
        } catch (err) {
          console.error("Error updating tags:", err);
          setError("Evaluation updated but failed to update tags");
          return data && data.length > 0 ? data[0] : null;
        }
      }
      
      toast({
        title: "Success",
        description: "Evaluation updated successfully",
      });
      
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error("Error updating evaluation:", err);
      toast({
        title: "Error",
        description: "Could not update evaluation",
        variant: "destructive",
      });
      throw err;
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  return {
    addEvaluation,
    updateEvaluation,
    saving,
    error
  };
};
