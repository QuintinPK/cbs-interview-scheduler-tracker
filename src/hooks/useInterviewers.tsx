
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Interviewer } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useInterviewers = () => {
  const { toast } = useToast();
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadInterviewers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('interviewers')
        .select('*')
        .order('code');
        
      if (error) throw error;
      
      // Ensure data conforms to the Interviewer interface
      const typedInterviewers: Interviewer[] = data?.map(interviewer => ({
        id: interviewer.id,
        code: interviewer.code,
        first_name: interviewer.first_name,
        last_name: interviewer.last_name,
        phone: interviewer.phone,
        email: interviewer.email,
        island: interviewer.island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined
      })) || [];
      
      setInterviewers(typedInterviewers);
    } catch (error) {
      console.error("Error loading interviewers:", error);
      toast({
        title: "Error",
        description: "Could not load interviewers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviewers();
  }, [toast]);

  const addInterviewer = async (interviewer: Omit<Interviewer, 'id'>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('interviewers')
        .insert([interviewer]);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "New interviewer added successfully",
      });
      
      await loadInterviewers();
    } catch (error) {
      console.error("Error adding interviewer:", error);
      toast({
        title: "Error",
        description: "Could not add interviewer",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateInterviewer = async (id: string, interviewer: Omit<Interviewer, 'id'>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('interviewers')
        .update(interviewer)
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Interviewer updated successfully",
      });
      
      await loadInterviewers();
    } catch (error) {
      console.error("Error updating interviewer:", error);
      toast({
        title: "Error",
        description: "Could not update interviewer",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteInterviewer = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('interviewers')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setInterviewers(interviewers.filter(i => i.id !== id));
      
      toast({
        title: "Success",
        description: "Interviewer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting interviewer:", error);
      toast({
        title: "Error",
        description: "Could not delete interviewer",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    interviewers,
    loading,
    addInterviewer,
    updateInterviewer,
    deleteInterviewer,
    refresh: loadInterviewers
  };
};
