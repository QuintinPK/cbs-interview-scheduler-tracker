
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { getCurrentLocation } from "@/lib/utils";

export const useInterviewActions = (sessionId: string | null) => {
  const { toast } = useToast();
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  const fetchActiveInterview = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      setIsInterviewLoading(true);
      
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      if (data) {
        // With the DB update, candidate_name should now be present in the data
        const interview: Interview = {
          ...data,
          candidate_name: data.candidate_name || "Unknown"
        };
        setActiveInterview(interview);
      } else {
        setActiveInterview(null);
      }
    } catch (error) {
      console.error("Error fetching active interview:", error);
    } finally {
      setIsInterviewLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (sessionId) {
      fetchActiveInterview(sessionId);
    } else {
      setActiveInterview(null);
    }
  }, [sessionId, fetchActiveInterview]);
  
  const startInterview = async (projectId?: string) => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No active session to attach an interview to",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsInterviewLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      // Get the session's project_id if not provided
      let interviewProjectId = projectId;
      if (!interviewProjectId) {
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .select('project_id')
          .eq('id', sessionId)
          .single();
        
        if (sessionError) throw sessionError;
        interviewProjectId = session?.project_id;
      }
      
      const { data, error } = await supabase
        .from('interviews')
        .insert([
          {
            session_id: sessionId,
            project_id: interviewProjectId,
            start_latitude: currentLocation?.latitude || null,
            start_longitude: currentLocation?.longitude || null,
            start_address: currentLocation?.address || null,
            is_active: true,
            candidate_name: "New interview" // Now explicitly add candidate_name
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // With the DB update, candidate_name should now be present in the data
      const interview: Interview = {
        ...data,
        candidate_name: data.candidate_name
      };
      
      setActiveInterview(interview);
      
      toast({
        title: "Interview Started",
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        title: "Error",
        description: "Could not start interview",
        variant: "destructive",
      });
    } finally {
      setIsInterviewLoading(false);
    }
  };
  
  const stopInterview = async () => {
    if (!activeInterview) return;
    
    try {
      setIsInterviewLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      // Update interview with end location but don't set result yet
      const { error } = await supabase
        .from('interviews')
        .update({
          end_time: new Date().toISOString(),
          end_latitude: currentLocation?.latitude || null,
          end_longitude: currentLocation?.longitude || null,
          end_address: currentLocation?.address || null,
        })
        .eq('id', activeInterview.id);
        
      if (error) throw error;
      
      // Show dialog to select interview result
      setShowResultDialog(true);
    } catch (error) {
      console.error("Error stopping interview:", error);
      toast({
        title: "Error",
        description: "Could not stop interview",
        variant: "destructive",
      });
    } finally {
      setIsInterviewLoading(false);
    }
  };
  
  const setInterviewResult = async (result: 'response' | 'non-response') => {
    if (!activeInterview) return;
    
    try {
      setIsInterviewLoading(true);
      
      const { error } = await supabase
        .from('interviews')
        .update({
          result,
          is_active: false
        })
        .eq('id', activeInterview.id);
        
      if (error) throw error;
      
      setActiveInterview(null);
      setShowResultDialog(false);
      
      toast({
        title: "Interview Completed",
        description: `Result: ${result === 'response' ? 'Response' : 'Non-response'}`,
      });
    } catch (error) {
      console.error("Error setting interview result:", error);
      toast({
        title: "Error",
        description: "Could not complete interview",
        variant: "destructive",
      });
    } finally {
      setIsInterviewLoading(false);
    }
  };
  
  const cancelResultDialog = () => {
    setShowResultDialog(false);
  };
  
  return {
    activeInterview,
    isInterviewLoading,
    showResultDialog,
    startInterview,
    stopInterview,
    setInterviewResult,
    cancelResultDialog,
    fetchActiveInterview
  };
};
