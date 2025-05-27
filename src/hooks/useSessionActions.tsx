
import { Session } from "@/types";
import { getSyncManager } from "@/lib/sync";
import { updateOfflineSession } from "@/lib/offlineDB"; 
import { getCurrentLocation } from "@/lib/utils";
import { useCallback } from "react";

export const useSessionActions = (
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: any
) => {

  /**
   * Stops an active session.
   * Updates the session in the offline DB, then queues the operation for sync.
   * Updates the UI optimistically.
   */
  const stopSession = useCallback(async (session: Session & { offlineId?: number }) => {
    setLoading(true);
    try {
      const endTime = new Date().toISOString();
      const currentLocation = await getCurrentLocation();
      const sessionEndData = {
        end_time: endTime,
        end_latitude: currentLocation?.latitude || null,
        end_longitude: currentLocation?.longitude || null,
        end_address: currentLocation?.address || null,
        is_active: false
      };

      // 1. Update offline DB first (if offlineId exists)
      if (typeof session.offlineId === 'number') {
        await updateOfflineSession(session.offlineId, endTime, currentLocation);
        console.log(`[useSessionActions] Updated offline session ${session.offlineId} to inactive.`);
      } else {
        console.warn(`[useSessionActions] No offlineId found for session ${session.id} during stop. Queuing with online ID.`);
      }

      // 2. Queue the operation for synchronization
      const syncManager = getSyncManager();
      await syncManager.queueOperation(
        'SESSION_END',
        sessionEndData,
        {
          offlineId: session.offlineId,
          onlineId: session.id,
          entityType: 'session'
        }
      );
      console.log(`[useSessionActions] Queued SESSION_END for session ${session.id || session.offlineId}`);

      // 3. Update local UI state optimistically
      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          (s.id && s.id === session.id) || (s.offlineId && s.offlineId === session.offlineId) 
            ? { ...s, ...sessionEndData } 
            : s
        )
      );

      toast({
        title: "Session Stop Queued",
        description: `Session stop action queued for synchronization.`,
      });

      return true;
    } catch (error) {
      console.error("Error stopping session:", error);
      toast({
        title: "Error Stopping Session",
        description: "Could not update offline DB or queue session stop action.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, toast, setSessions]);

  /**
   * Updates arbitrary fields of a session.
   */
  const updateSession = useCallback(async (sessionId: string, updateData: Partial<Session>) => {
    setLoading(true);
    try {
      const syncManager = getSyncManager();
      await syncManager.queueOperation(
        'SESSION_UPDATE',
        updateData,
        {
          onlineId: sessionId,
          entityType: 'session'
        }
      );
      console.log(`[useSessionActions] Queued SESSION_UPDATE for session ${sessionId}`);

      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === sessionId ? { ...s, ...updateData } : s
        )
      );

      toast({
        title: "Session Update Queued",
        description: "Session update action queued for synchronization.",
      });

      return true;
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error Updating Session",
        description: "Could not queue session update action.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, toast, setSessions]);

  /**
   * Deletes a session.
   */
  const deleteSession = useCallback(async (sessionId: string, offlineId?: number) => {
    setLoading(true);
    try {
      const syncManager = getSyncManager();
      await syncManager.queueOperation(
        'SESSION_DELETE',
        { id: sessionId },
        {
          onlineId: sessionId,
          offlineId: offlineId,
          entityType: 'session'
        }
      );
      console.log(`[useSessionActions] Queued SESSION_DELETE for session ${sessionId}`);

      setSessions((prevSessions) => prevSessions.filter(s => s.id !== sessionId));

      toast({
        title: "Session Delete Queued",
        description: "Session delete action queued for synchronization.",
      });

      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error Deleting Session",
        description: "Could not queue session delete action.",
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
