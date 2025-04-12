import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@/types";
import { getCurrentLocation } from "@/lib/utils";

export const useSessionActions = (
  sessions: Session[],
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>,
  filteredSessions: Session[],
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: any
) => {
  // Helper function to find a session by ID
  const findSession = (sessionId: string): Session | undefined => {
    return sessions.find(session => session.id === sessionId);
  };

  // Stop a session by ID
  const stopSession = async (sessionId: string) => {
    try {
      setLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      // Get the current date/time
      const now = new Date().toISOString();
      
      const updates = {
        is_active: false,
        end_time: now,
        end_latitude: currentLocation?.latitude || null,
        end_longitude: currentLocation?.longitude || null,
      };
      
      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Update local state
      const updatedSessions = sessions.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates } 
          : session
      );
      
      setSessions(updatedSessions);
      
      toast({
        title: "Session Stopped",
        description: "The session has been marked as completed.",
      });
      
      return true;
    } catch (error) {
      console.error("Error stopping session:", error);
      toast({
        title: "Error",
        description: "Failed to stop session. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Update a session
  const updateSession = async (sessionId: string, updates: Partial<Session>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Update local state
      const updatedSessions = sessions.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates } 
          : session
      );
      
      setSessions(updatedSessions);
      
      toast({
        title: "Session Updated",
        description: "The session has been updated successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description: "Failed to update session. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a session by ID
  const deleteSession = async (sessionId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Update local state by removing the deleted session
      const updatedSessions = sessions.filter(session => session.id !== sessionId);
      setSessions(updatedSessions);
      
      toast({
        title: "Session Deleted",
        description: "The session has been permanently deleted.",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
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
