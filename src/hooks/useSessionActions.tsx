
import { Session } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation } from "@/lib/utils";
import { useCallback } from "react";
import { useOffline } from "@/contexts/OfflineContext";
import { useInterviewActions } from "./useInterviewActions";

export const useSessionActions = (
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: any,
  sessions?: Session[],
  setSessions?: React.Dispatch<React.SetStateAction<Session[]>>,
  unusualSessions?: Session[],
  setUnusualSessions?: React.Dispatch<React.SetStateAction<Session[]>>
) => {
  const { isOnline, saveSession, updateSession } = useOffline();

  const startSession = useCallback(async (interviewerId: string, projectId: string) => {
    try {
      setLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      const newSession: Session = {
        id: crypto.randomUUID(),
        interviewer_id: interviewerId,
        project_id: projectId,
        start_time: new Date().toISOString(),
        end_time: null,
        start_latitude: currentLocation?.latitude || null,
        start_longitude: currentLocation?.longitude || null,
        start_address: currentLocation?.address || null,
        end_latitude: null,
        end_longitude: null,
        end_address: null,
        is_active: true,
        is_unusual_reviewed: false,
        sync_status: 'unsynced',
        local_id: crypto.randomUUID()
      };
      
      if (isOnline) {
        try {
          const { data: session, error: insertError } = await supabase
            .from('sessions')
            .insert([{
              interviewer_id: interviewerId,
              project_id: projectId,
              start_latitude: currentLocation?.latitude || null,
              start_longitude: currentLocation?.longitude || null,
              start_address: currentLocation?.address || null,
              is_active: true
            }])
            .select()
            .single();
            
          if (!insertError && session) {
            newSession.id = session.id;
            newSession.sync_status = 'synced';
          }
        } catch (error) {
          console.error("Error creating session on server:", error);
        }
      }

      const savedSession = await saveSession(newSession);
      
      toast({
        title: "Session Started",
        description: `Started at ${new Date().toLocaleTimeString()}`,
      });
      
      return savedSession;
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Could not start session",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [isOnline, saveSession, setLoading, toast]);
  
  const stopSession = useCallback(async (session: Session) => {
    if (!session) return false;
    
    try {
      setLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      const updatedSession: Session = {
        ...session,
        end_time: new Date().toISOString(),
        end_latitude: currentLocation?.latitude || null,
        end_longitude: currentLocation?.longitude || null,
        end_address: currentLocation?.address || null,
        is_active: false,
        sync_status: session.sync_status === 'synced' ? 'unsynced' : 'unsynced'
      };
      
      await updateSession(updatedSession);
      
      if (isOnline && session.sync_status === 'synced') {
        try {
          await supabase
            .from('sessions')
            .update({
              end_time: new Date().toISOString(),
              end_latitude: currentLocation?.latitude || null,
              end_longitude: currentLocation?.longitude || null,
              end_address: currentLocation?.address || null,
              is_active: false
            })
            .eq('id', session.id);
            
          await updateSession({
            ...updatedSession,
            sync_status: 'synced'
          });
        } catch (error) {
          console.error("Error updating session on server:", error);
        }
      }
      
      toast({
        title: "Session Ended",
        description: `Ended at ${new Date().toLocaleTimeString()}`,
      });
      
      return true;
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Could not end session",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isOnline, updateSession, setLoading, toast]);

  // Add missing updateSession function for admin features
  const updateSessionAdmin = useCallback(async (sessionId: string, data: Partial<Session>) => {
    try {
      setLoading(true);
      
      if (isOnline) {
        const { error } = await supabase
          .from('sessions')
          .update(data)
          .eq('id', sessionId);
          
        if (error) throw error;
        
        // Update local sessions list if available
        if (sessions && setSessions) {
          setSessions(prevSessions => 
            prevSessions.map(session => 
              session.id === sessionId ? { ...session, ...data } : session
            )
          );
        }
        
        // Update unusual sessions list if available
        if (unusualSessions && setUnusualSessions) {
          setUnusualSessions(prevSessions => 
            prevSessions.map(session => 
              session.id === sessionId ? { ...session, ...data } : session
            )
          );
        }
        
        toast({
          title: "Session Updated",
          description: "Session details have been updated.",
        });
        
        return true;
      } else {
        toast({
          title: "Error",
          description: "Cannot update session while offline",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isOnline, sessions, setSessions, unusualSessions, setUnusualSessions, setLoading, toast]);
  
  // Add missing deleteSession function for admin features
  const deleteSessionAdmin = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      
      if (isOnline) {
        const { error } = await supabase
          .from('sessions')
          .delete()
          .eq('id', sessionId);
          
        if (error) throw error;
        
        // Update local sessions list if available
        if (sessions && setSessions) {
          setSessions(prevSessions => 
            prevSessions.filter(session => session.id !== sessionId)
          );
        }
        
        // Update unusual sessions list if available
        if (unusualSessions && setUnusualSessions) {
          setUnusualSessions(prevSessions => 
            prevSessions.filter(session => session.id !== sessionId)
          );
        }
        
        toast({
          title: "Session Deleted",
          description: "Session has been permanently removed.",
        });
        
        return true;
      } else {
        toast({
          title: "Error",
          description: "Cannot delete session while offline",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isOnline, sessions, setSessions, unusualSessions, setUnusualSessions, setLoading, toast]);
  
  return {
    startSession,
    stopSession,
    updateSession: updateSessionAdmin,
    deleteSession: deleteSessionAdmin
  };
};
