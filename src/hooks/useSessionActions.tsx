
import { Session } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation } from "@/lib/utils";
import { useCallback } from "react";

export const useSessionActions = (
  sessions: Session[], 
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>,
  filteredSessions: Session[],
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: any
) => {
  
  const stopSession = useCallback(async (session: Session) => {
    try {
      setLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: new Date().toISOString(),
          end_latitude: currentLocation?.latitude || null,
          end_longitude: currentLocation?.longitude || null,
          end_address: currentLocation?.address || null,
          is_active: false
        })
        .eq('id', session.id);
        
      if (error) throw error;
      
      toast({
        title: "Session Stopped",
        description: `Session has been stopped.`,
      });
      
      return true;
    } catch (error) {
      console.error("Error stopping session:", error);
      toast({
        title: "Error",
        description: "Could not stop session",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, toast]);
  
  const updateSession = useCallback(async (sessionId: string, updateData: Partial<Session>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);
        
      if (error) throw error;
      
      toast({
        title: "Session Updated",
        description: "Session has been updated successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description: "Could not update session",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, toast]);
  
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Update sessions state by filtering the array properly
      setSessions((prevSessions) => prevSessions.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session Deleted",
        description: "Session has been deleted successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Could not delete session",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [setSessions, setLoading, toast]);
  
  return {
    stopSession,
    updateSession,
    deleteSession
  };
};
