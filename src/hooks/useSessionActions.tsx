
import { Session } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation } from "@/lib/utils";

export const useSessionActions = (
  sessions: Session[], 
  setSessions: (sessions: Session[]) => void,
  filteredSessions: Session[],
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: any
) => {
  
  const stopSession = async (session: Session) => {
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
  };
  
  const updateSession = async (sessionId: string, updateData: Partial<Session>) => {
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
  };
  
  const deleteSession = async (sessionId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Update sessions state by creating a new array without the deleted session
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      
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
  };
  
  return {
    stopSession,
    updateSession,
    deleteSession
  };
};
