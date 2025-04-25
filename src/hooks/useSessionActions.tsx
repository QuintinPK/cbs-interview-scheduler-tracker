
import { Session } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation } from "@/lib/utils";
import { useCallback } from "react";
import { useOffline } from "@/contexts/OfflineContext";
import { useInterviewActions } from "./useInterviewActions";

export const useSessionActions = (
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: any
) => {
  const { isOnline, saveSession, updateSession } = useOffline();

  const startSession = useCallback(async (interviewerId: string, projectId: string) => {
    try {
      setLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      const newSession = {
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
  
  return {
    startSession,
    stopSession
  };
};
