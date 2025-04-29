
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EvaluationTag, InterviewerEvaluation } from "@/types";

export const useEvaluations = (interviewerId?: string) => {
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<InterviewerEvaluation[]>([]);
  const [evaluationTags, setEvaluationTags] = useState<EvaluationTag[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all evaluation tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('evaluation_tags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (tagsError) throw tagsError;
      setEvaluationTags(tagsData || []);
      
      // If no interviewer ID is provided, don't fetch evaluations
      if (!interviewerId) {
        setEvaluations([]);
        return;
      }
      
      // Fetch evaluations for the specified interviewer
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('interviewer_evaluations')
        .select('*')
        .eq('interviewer_id', interviewerId)
        .order('created_at', { ascending: false });
      
      if (evaluationsError) throw evaluationsError;
      
      // Get tags for each evaluation
      const evaluationsWithTags = await Promise.all((evaluationsData || []).map(async (evaluation) => {
        const { data: junctionData, error: junctionError } = await supabase
          .from('evaluation_tags_junction')
          .select('tag_id')
          .eq('evaluation_id', evaluation.id);
        
        if (junctionError) throw junctionError;
        
        if (junctionData && junctionData.length > 0) {
          const tagIds = junctionData.map(item => item.tag_id);
          const { data: evaluationTagsData } = await supabase
            .from('evaluation_tags')
            .select('*')
            .in('id', tagIds);
          
          return { ...evaluation, tags: evaluationTagsData || [] };
        }
        
        return { ...evaluation, tags: [] };
      }));
      
      setEvaluations(evaluationsWithTags);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      toast({
        title: "Error",
        description: "Could not load evaluations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [interviewerId, toast]);
  
  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);
  
  const addEvaluation = async (evaluation: Omit<InterviewerEvaluation, 'id' | 'created_at'>, tagIds: string[]) => {
    try {
      setLoading(true);
      
      // Insert evaluation
      const { data: evaluationData, error: evaluationError } = await supabase
        .from('interviewer_evaluations')
        .insert([evaluation])
        .select('*')
        .single();
      
      if (evaluationError) throw evaluationError;
      
      // Insert tag junctions if tags are provided
      if (tagIds.length > 0) {
        const junctions = tagIds.map(tagId => ({
          evaluation_id: evaluationData.id,
          tag_id: tagId
        }));
        
        const { error: junctionError } = await supabase
          .from('evaluation_tags_junction')
          .insert(junctions);
        
        if (junctionError) throw junctionError;
      }
      
      toast({
        title: "Success",
        description: "Evaluation added successfully",
      });
      
      await fetchEvaluations();
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
  
  const updateEvaluation = async (
    id: string,
    evaluation: Partial<Omit<InterviewerEvaluation, 'id' | 'created_at'>>,
    tagIds?: string[]
  ) => {
    try {
      setLoading(true);
      
      // Update evaluation
      const { error: evaluationError } = await supabase
        .from('interviewer_evaluations')
        .update(evaluation)
        .eq('id', id);
      
      if (evaluationError) throw evaluationError;
      
      // Update tags if provided
      if (tagIds !== undefined) {
        // Delete existing junctions
        const { error: deleteError } = await supabase
          .from('evaluation_tags_junction')
          .delete()
          .eq('evaluation_id', id);
        
        if (deleteError) throw deleteError;
        
        // Insert new junctions
        if (tagIds.length > 0) {
          const junctions = tagIds.map(tagId => ({
            evaluation_id: id,
            tag_id: tagId
          }));
          
          const { error: junctionError } = await supabase
            .from('evaluation_tags_junction')
            .insert(junctions);
          
          if (junctionError) throw junctionError;
        }
      }
      
      toast({
        title: "Success",
        description: "Evaluation updated successfully",
      });
      
      await fetchEvaluations();
    } catch (error) {
      console.error("Error updating evaluation:", error);
      toast({
        title: "Error",
        description: "Could not update evaluation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteEvaluation = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('interviewer_evaluations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Evaluation deleted successfully",
      });
      
      setEvaluations(evaluations.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      toast({
        title: "Error",
        description: "Could not delete evaluation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const getAverageRating = (interviewerId: string): number | null => {
    const interviewerEvaluations = evaluations.filter(e => e.interviewer_id === interviewerId);
    if (interviewerEvaluations.length === 0) return null;
    
    const sum = interviewerEvaluations.reduce((acc, curr) => acc + curr.rating, 0);
    return parseFloat((sum / interviewerEvaluations.length).toFixed(1));
  };
  
  return {
    evaluations,
    evaluationTags,
    loading,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    getAverageRating,
    refresh: fetchEvaluations
  };
};
