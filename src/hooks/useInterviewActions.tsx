import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";
import { getCurrentLocation } from "@/lib/utils";
import { useOffline } from "@/contexts/OfflineContext";
import { v4 as uuidv4 } from "uuid";

export const useInterviewActions = (sessionId: string | null) => {
  const { toast } = useToast();
  const { 
    isOnline, 
    saveInterview, 
    updateInterview, 
    getInterviewsForSession 
  } = useOffline();
  
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  const fetchActiveInterview = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      setIsInterviewLoading(true);
      
      // First check local storage
      const localInterviews = await getInterviewsForSession(sessionId);
      const activeLocalInterview = localInterviews.find(i => i.is_active);
      
      if (activeLocalInterview) {
        setActiveInterview(activeLocalInterview);
        return;
      }
      
      // If online and no active local interview, check Supabase
      if (isOnline) {
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
          // Save to local storage with synced status
          const savedInterview = await saveInterview({
            ...data,
            sync_status: 'synced'
          });
          
          setActiveInterview(savedInterview);
        } else {
          setActiveInterview(null);
        }
      }
    } catch (error) {
      console.error("Error fetching active interview:", error);
    } finally {
      setIsInterviewLoading(false);
    }
  }, [isOnline, getInterviewsForSession, saveInterview]);
  
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
      
      // Create a new interview locally
      const newInterview: Interview = {
        id: uuidv4(), // Temporary ID, will be replaced by server on sync
        session_id: sessionId,
        project_id: projectId,
        start_time: new Date().toISOString(),
        end_time: null,
        start_latitude: currentLocation?.latitude || null,
        start_longitude: currentLocation?.longitude || null,
        start_address: currentLocation?.address || null,
        end_latitude: null,
        end_longitude: null,
        end_address: null,
        result: null,
        is_active: true,
        sync_status: 'unsynced',
      };
      
      // Save locally first
      const savedInterview = await saveInterview(newInterview);
      setActiveInterview(savedInterview);
      
      // If online, try to sync immediately
      if (isOnline) {
        const { data, error } = await supabase
          .from('interviews')
          .insert([{
            session_id: sessionId,
            project_id: projectId,
            start_latitude: currentLocation?.latitude || null,
            start_longitude: currentLocation?.longitude || null,
            start_address: currentLocation?.address || null,
            is_active: true
          }])
          .select()
          .single();
          
        if (!error && data) {
          // Update local storage with server ID
          const updatedInterview = await updateInterview({
            ...savedInterview,
            id: data.id,
            sync_status: 'synced'
          });
          
          setActiveInterview(updatedInterview);
        }
      }
      
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
  
  const stopInterview = async (): Promise<boolean> => {
    if (!activeInterview) return true;
    
    try {
      setIsInterviewLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      // Update local interview with end location but keep it active until result is set
      const updatedInterview = await updateInterview({
        ...activeInterview,
        end_time: new Date().toISOString(),
        end_latitude: currentLocation?.latitude || null,
        end_longitude: currentLocation?.longitude || null,
        end_address: currentLocation?.address || null,
      });
      
      setActiveInterview(updatedInterview);
      
      // If online, try to update on server as well
      if (isOnline && activeInterview.sync_status === 'synced') {
        await supabase
          .from('interviews')
          .update({
            end_time: new Date().toISOString(),
            end_latitude: currentLocation?.latitude || null,
            end_longitude: currentLocation?.longitude || null,
            end_address: currentLocation?.address || null,
          })
          .eq('id', activeInterview.id);
      }
      
      // Show dialog to select interview result
      setShowResultDialog(true);
      
      // Return false to indicate that stopping is not complete yet (needs result)
      return false;
    } catch (error) {
      console.error("Error stopping interview:", error);
      toast({
        title: "Error",
        description: "Could not stop interview",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsInterviewLoading(false);
    }
  };
  
  const setInterviewResult = async (result: 'response' | 'non-response'): Promise<boolean> => {
    if (!activeInterview) return false;
    
    try {
      setIsInterviewLoading(true);
      
      // Update locally first
      const updatedInterview = await updateInterview({
        ...activeInterview,
        result,
        is_active: false,
        sync_status: activeInterview.sync_status === 'synced' ? 'unsynced' : 'unsynced'
      });
      
      // If online and interview was already synced, update on server as well
      if (isOnline && activeInterview.sync_status === 'synced') {
        const { error } = await supabase
          .from('interviews')
          .update({
            result,
            is_active: false
          })
          .eq('id', activeInterview.id);
          
        if (!error) {
          // Mark as synced again
          await updateInterview({
            ...updatedInterview,
            sync_status: 'synced'
          });
        }
      }
      
      setActiveInterview(null);
      setShowResultDialog(false);
      
      toast({
        title: "Interview Completed",
        description: `Result: ${result === 'response' ? 'Response' : 'Non-response'}`,
      });
      
      return true;
    } catch (error) {
      console.error("Error setting interview result:", error);
      toast({
        title: "Error",
        description: "Could not complete interview",
        variant: "destructive",
      });
      return false;
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
