
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EvaluationTag } from "@/types";

export const useEvaluationBase = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<EvaluationTag[]>([]);
  
  const loadEvaluationTags = async () => {
    try {
      setLoading(true);
      console.log("Loading evaluation tags");
      
      const { data, error } = await supabase
        .from('evaluation_tags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
        
      if (error) {
        console.error("Error fetching tags:", error);
        throw error;
      }
      
      console.log("Loaded tags:", data);
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
  };
  
  return {
    loading,
    setLoading,
    tags,
    setTags,
    loadEvaluationTags,
    toast
  };
};
