import { Session } from "@/types";
// Assume syncQueueManager is a singleton instance exported from your sync setup
import { syncQueueManager } from "@/lib/sync/syncManager"; 
// Import necessary offline functions
// NOTE: deleteOfflineSession is assumed to exist or needs to be created in '@/lib/offline/sessions.ts'
import { updateOfflineSession, /* deleteOfflineSession */ } from "@/lib/offlineDB"; 
import { getCurrentLocation } from "@/lib/utils";
import { useCallback } from "react";

// --- IMPORTANT ASSUMPTIONS --- 
// 1. `syncQueueManager` is imported and correctly instantiated somewhere accessible.
// 2. The `SyncOperationType` in `src/lib/sync/types.ts` includes 'SESSION_UPDATE' and 'SESSION_DELETE'.
// 3. The `Session` type might include an optional `offlineId: number` field for sessions created offline.
// 4. A function `deleteOfflineSession(offlineId: number)` exists or will be created in `src/lib/offline/sessions.ts`.
// 5. The sync processors (`sessionProcessor.ts`) are updated to handle 'SESSION_UPDATE' and 'SESSION_DELETE' operations.
// 6. Mapping between online `id` (string) and offline `id` (number) might be necessary for update/delete, 
//    this implementation assumes the correct ID is available or the operation relies on the online ID for queuing.

export const useSessionActions = (
  // sessions: Session[], // This might become less relevant if UI updates rely on listeners to sync/offline changes
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>, // Used for optimistic UI updates
  // filteredSessions: Session[], // Likely not needed here
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: any // Assuming a toast function compatible with shadcn/ui
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
        is_active: false // Mark as inactive
      };

      // 1. Update offline DB first (if offlineId exists)
      if (typeof session.offlineId === 'number') {
        await updateOfflineSession(session.offlineId, endTime, currentLocation);
        console.log(`[useSessionActions] Updated offline session ${session.offlineId} to inactive.`);
      } else {
        // If no offlineId, it might be an online-only session or already synced.
        // The sync queue should still handle it using the online ID.
        console.warn(`[useSessionActions] No offlineId found for session ${session.id} during stop. Queuing with online ID.`);
      }

      // 2. Queue the operation for synchronization
      await syncQueueManager.queueOperation(
        'SESSION_END', // Standard operation type
        sessionEndData, // Data payload for the update
        {
          offlineId: session.offlineId, // Pass offlineId if available
          onlineId: session.id,       // Pass onlineId (UUID from Supabase)
          entityType: 'session'
        }
      );
      console.log(`[useSessionActions] Queued SESSION_END for session ${session.id || session.offlineId}`);

      // 3. Update local UI state optimistically
      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          // Match by online ID if available, otherwise fallback to offlineId for purely offline items
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
   * Queues the update operation for sync. Updates UI optimistically.
   * NOTE: Does not directly update arbitrary fields in the offline DB in this version,
   * as `updateOfflineSession` is specific to ending a session. Requires sync processor logic.
   */
  const updateSession = useCallback(async (sessionId: string, updateData: Partial<Session>) => {
    setLoading(true);
    try {
      // 1. Queue the operation for synchronization
      // Assumes 'SESSION_UPDATE' type exists and the processor handles it.
      await syncQueueManager.queueOperation(
        'SESSION_UPDATE', // Ensure this type exists in SyncOperationType
        updateData,       // The partial data to update
        {
          onlineId: sessionId, // Assumes we always have the onlineId for updates
          entityType: 'session'
        }
      );
      console.log(`[useSessionActions] Queued SESSION_UPDATE for session ${sessionId}`);

      // 2. Update local UI state optimistically
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
   * Attempts to delete from offline DB (if function exists and ID mapping is possible),
   * then queues the delete operation for sync. Updates UI optimistically.
   */
  const deleteSession = useCallback(async (sessionId: string, offlineId?: number) => {
    setLoading(true);
    try {
      // Optional Step: Attempt to delete from offline DB first if possible.
      // This requires the deleteOfflineSession function and the correct offlineId.
      /*
      if (typeof offlineId === 'number') {
        try {
          // Assumes deleteOfflineSession(offlineId: number) exists
          await deleteOfflineSession(offlineId);
          console.log(`[useSessionActions] Deleted offline session ${offlineId}`);
        } catch (offlineError) {
          console.error(`[useSessionActions] Failed to delete offline session ${offlineId}:`, offlineError);
          // Decide if you want to proceed with queuing despite offline delete failure
        }
      } else {
         console.warn(`[useSessionActions] No offlineId provided for delete operation on session ${sessionId}. Cannot delete locally.`);
      }
      */

      // 1. Queue the operation for synchronization
      // Assumes 'SESSION_DELETE' type exists and the processor handles it.
      await syncQueueManager.queueOperation(
        'SESSION_DELETE', // Ensure this type exists in SyncOperationType
        { id: sessionId }, // Include identifier in payload if needed by processor
        {
          onlineId: sessionId, // Assumes we always have the onlineId for deletes
          offlineId: offlineId, // Pass offlineId if available
          entityType: 'session'
        }
      );
      console.log(`[useSessionActions] Queued SESSION_DELETE for session ${sessionId}`);

      // 2. Update local UI state optimistically
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
