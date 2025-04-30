
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Evaluation, EvaluationTag } from "@/types";

export const useEvaluations = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [tags, setTags] = useState<EvaluationTag[]>([]);
  
  const loadEvaluationTags = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evaluation_tags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setTags(data || []);
    } catch (error) {
      console.error("Error loading evaluation tags:", error);
      toast({
        title: "Error",
        description: "Could not load evaluation tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const loadEvaluationsByInterviewer = useCallback(async (interviewerId: string) => {
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
  }, [toast]);
  
  const addEvaluation = useCallback(async (evaluation: {
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
  }, [toast]);

  const getAverageRating = useCallback(async (interviewerId: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('interviewer_evaluations')
        .select('rating')
        .eq('interviewer_id', interviewerId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      // Changed 'eval' to 'item' to avoid reserved keyword issue
      const total = data.reduce((sum, item) => sum + item.rating, 0);
      return Number((total / data.length).toFixed(1));
    } catch (error) {
      console.error("Error getting average rating:", error);
      return null;
    }
  }, []);

  const getAllAverageRatings = useCallback(async (): Promise<Record<string, number>> => {
    try {
      const { data, error } = await supabase
        .from('interviewer_evaluations')
        .select('interviewer_id, rating');
        
      if (error) throw error;
      
      if (!data || data.length === 0) return {};
      
      // Group evaluations by interviewer and calculate averages
      const ratingsByInterviewer: Record<string, number[]> = {};
      
      // Changed 'eval' to 'evaluation' to avoid reserved keyword issue
      data.forEach(evaluation => {
        if (!ratingsByInterviewer[evaluation.interviewer_id]) {
          ratingsByInterviewer[evaluation.interviewer_id] = [];
        }
        ratingsByInterviewer[evaluation.interviewer_id].push(evaluation.rating);
      });
      
      const averageRatings: Record<string, number> = {};
      
      Object.entries(ratingsByInterviewer).forEach(([interviewerId, ratings]) => {
        const total = ratings.reduce((sum, rating) => sum + rating, 0);
        averageRatings[interviewerId] = Number((total / ratings.length).toFixed(1));
      });
      
      return averageRatings;
    } catch (error) {
      console.error("Error getting all average ratings:", error);
      return {};
    }
  }, []);
  
  return {
    evaluations,
    tags,
    loading,
    loadEvaluationTags,
    loadEvaluationsByInterviewer,
    addEvaluation,
    getAverageRating,
    getAllAverageRatings
  };
};
