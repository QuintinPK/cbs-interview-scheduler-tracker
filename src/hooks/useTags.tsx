
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EvaluationTag } from "@/types";

export const useTags = () => {
  const { toast } = useToast();
  const [tags, setTags] = useState<EvaluationTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchTags = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('evaluation_tags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setTags(data || []);
      return data || [];
    } catch (err: any) {
      console.error("Error loading tags:", err);
      setError(err.message || "Failed to load tags");
      toast({
        title: "Error",
        description: "Failed to load evaluation tags",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const addTag = useCallback(async (name: string, category: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('evaluation_tags')
        .insert([{ name, category }])
        .select();
        
      if (error) throw error;
      
      await fetchTags(true);
      return data?.[0] || null;
    } catch (err: any) {
      console.error("Error adding tag:", err);
      setError(err.message || "Failed to add tag");
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTags, toast]);
  
  const updateTag = useCallback(async (id: string, name: string, category: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('evaluation_tags')
        .update({ name, category })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      await fetchTags(true);
      return data?.[0] || null;
    } catch (err: any) {
      console.error("Error updating tag:", err);
      setError(err.message || "Failed to update tag");
      toast({
        title: "Error",
        description: "Failed to update tag",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTags, toast]);
  
  const deleteTag = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if tag is in use
      const { data: junctionData, error: junctionError } = await supabase
        .from('evaluation_tags_junction')
        .select('evaluation_id')
        .eq('tag_id', id);
        
      if (junctionError) throw junctionError;
      
      if (junctionData && junctionData.length > 0) {
        const errorMsg = `This tag is used in ${junctionData.length} evaluation(s). Remove the tag from these evaluations first.`;
        setError(errorMsg);
        toast({
          title: "Cannot Delete",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      }
      
      // If not in use, proceed with deletion
      const { error } = await supabase
        .from('evaluation_tags')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      await fetchTags(true);
      return true;
    } catch (err: any) {
      console.error("Error deleting tag:", err);
      setError(err.message || "Failed to delete tag");
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTags, toast]);
  
  // Load tags when component mounts
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);
  
  return {
    tags,
    loading,
    error,
    fetchTags,
    addTag,
    updateTag,
    deleteTag
  };
};

export default useTags;
