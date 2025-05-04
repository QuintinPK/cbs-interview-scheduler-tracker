
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EvaluationTag } from "@/types";

export const useEvaluationBase = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<EvaluationTag[]>([]);
  const tagsCache = useRef<EvaluationTag[]>([]);
  const lastFetch = useRef<number>(0);
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  
  const loadEvaluationTags = useCallback(async (forceRefresh = false) => {
    // Return cached data if available and not expired
    const now = Date.now();
    if (!forceRefresh && tagsCache.current.length > 0 && (now - lastFetch.current) < CACHE_TTL) {
      setTags(tagsCache.current);
      return tagsCache.current;
    }
    
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
        return [];
      }
      
      console.log("Loaded tags:", data);
      // Update cache
      tagsCache.current = data || [];
      lastFetch.current = now;
      
      setTags(data || []);
      return data || [];
    } catch (err) {
      console.error("Error loading evaluation tags:", err);
      setError("An unexpected error occurred while loading tags");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
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
