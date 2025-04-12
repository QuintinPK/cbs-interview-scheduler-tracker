
import { useState } from "react";
import { Interview } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation } from "@/lib/utils";

export const useInterviewActions = (sessionId: string | null) => {
  const { toast } = useToast();
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  const startInterview = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No active session found. Please start a session first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsInterviewLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      // Use any to bypass type checking temporarily since the database schema has changed
      // but the TypeScript definitions haven't been regenerated yet
      const { data, error } = await (supabase as any)
        .from('interviews')
        .insert([{
          session_id: sessionId,
          start_latitude: currentLocation?.latitude || null,
          start_longitude: currentLocation?.longitude || null,
          start_address: currentLocation?.address || null,
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Type assertion to convert 'any' to Interview
      setActiveInterview(data as Interview);
      
      toast({
        title: "Interview Started",
        description: `Interview started at ${new Date().toLocaleTimeString()}`,
      });
      
      return data as Interview;
    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        title: "Error",
        description: "Could not start interview",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsInterviewLoading(false);
    }
  };
  
  const stopInterview = async () => {
    if (!activeInterview) {
      toast({
        title: "Error",
        description: "No active interview found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsInterviewLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      // We'll update the end time and location, but keep is_active as true
      // until the result is selected
      const { error } = await (supabase as any)
        .from('interviews')
        .update({
          end_time: new Date().toISOString(),
          end_latitude: currentLocation?.latitude || null,
          end_longitude: currentLocation?.longitude || null,
          end_address: currentLocation?.address || null,
        })
        .eq('id', activeInterview.id);
      
      if (error) throw error;
      
      // Show result dialog
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
      
      const { error } = await (supabase as any)
        .from('interviews')
        .update({
          result: result,
          is_active: false
        })
        .eq('id', activeInterview.id);
      
      if (error) throw error;
      
      setShowResultDialog(false);
      setActiveInterview(null);
      
      toast({
        title: "Interview Completed",
        description: `Result recorded: ${result}`,
      });
    } catch (error) {
      console.error("Error setting interview result:", error);
      toast({
        title: "Error",
        description: "Could not save interview result",
        variant: "destructive",
      });
    } finally {
      setIsInterviewLoading(false);
    }
  };
  
  const cancelResultDialog = () => {
    setShowResultDialog(false);
  };
  
  const fetchActiveInterview = async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('interviews')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setActiveInterview(data as Interview);
      }
      
      return data as Interview | null;
    } catch (error) {
      console.error("Error fetching active interview:", error);
      return null;
    }
  };
  
  return {
    activeInterview,
    setActiveInterview,
    isInterviewLoading,
    showResultDialog,
    startInterview,
    stopInterview,
    setInterviewResult,
    cancelResultDialog,
    fetchActiveInterview
  };
};
