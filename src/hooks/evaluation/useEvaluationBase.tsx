
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EvaluationTag } from "@/types";

export const useEvaluationBase = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<EvaluationTag[]>([]);
  
  const loadEvaluationTags = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading evaluation tags");
      
      const { data, error } = await supabase
        .from('evaluation_tags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
        
      if (error) {
        console.error("Error fetching tags:", error);
        setError("Failed to load evaluation tags");
        setTags([]);
        return;
      }
      
      console.log("Loaded tags:", data);
      setTags(data || []);
    } catch (err) {
      console.error("Error loading evaluation tags:", err);
      setError("An unexpected error occurred while loading tags");
      setTags([]);
      toast({
        title: "Error",
        description: "Could not load evaluation tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    setLoading,
    error,
    setError,
    tags,
    setTags,
    loadEvaluationTags,
    toast
  };
};
