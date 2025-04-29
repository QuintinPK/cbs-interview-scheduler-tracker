
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interviewer } from "@/types";

export const useInterviewer = (id: string) => {
  const { toast } = useToast();
  const [interviewer, setInterviewer] = useState<Interviewer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInterviewer = useCallback(async () => {
    if (!id) {
      setInterviewer(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("interviewers")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      setInterviewer(data as Interviewer);
    } catch (error) {
      console.error("Error fetching interviewer:", error);
      toast({
        title: "Error",
        description: "Could not load interviewer details",
        variant: "destructive",
      });
      setInterviewer(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchInterviewer();
  }, [fetchInterviewer]);

  return {
    interviewer,
    loading,
    refresh: fetchInterviewer
  };
};
