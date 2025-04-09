
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types';
import { useToast } from './use-toast';
import { 
  getPendingSessions, 
  removePendingSession, 
  clearPendingSessions 
} from '@/lib/offlineStorage';
import { useConnectionStatus } from './useConnectionStatus';

export const useSyncManager = () => {
  const { toast } = useToast();
  const { isOnline, wasOffline, resetWasOffline } = useConnectionStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Update pending count whenever needed
  const updatePendingCount = useCallback(() => {
    const pendingSessions = getPendingSessions();
    setPendingCount(pendingSessions.length);
  }, []);

  // Effect to check pending sessions when component mounts
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Effect to trigger sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      syncPendingSessions();
      resetWasOffline();
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  // Function to sync a single session
  const syncSession = async (sessionData: Partial<Session> & { client_id: string }): Promise<boolean> => {
    try {
      // Handle start session (no end time)
      if (!sessionData.end_time) {
        const { data, error } = await supabase
          .from('sessions')
          .insert([{
            interviewer_id: sessionData.interviewer_id,
            start_time: sessionData.start_time,
            start_latitude: sessionData.start_latitude,
            start_longitude: sessionData.start_longitude,
            start_address: sessionData.start_address,
            is_active: true
          }])
          .select();

        if (error) throw error;
        console.log('Successfully synced start session:', data);
        return true;
      } 
      // Handle complete session (has end time)
      else {
        // First check if the session already exists
        if (sessionData.id) {
          // Update existing session
          const { error } = await supabase
            .from('sessions')
            .update({
              end_time: sessionData.end_time,
              end_latitude: sessionData.end_latitude,
              end_longitude: sessionData.end_longitude,
              end_address: sessionData.end_address,
              is_active: false
            })
            .eq('id', sessionData.id);

          if (error) throw error;
          console.log('Successfully synced end session for existing session');
          return true;
        } else {
          // Create completed session in one go
          const { error } = await supabase
            .from('sessions')
            .insert([{
              interviewer_id: sessionData.interviewer_id,
              start_time: sessionData.start_time,
              start_latitude: sessionData.start_latitude,
              start_longitude: sessionData.start_longitude,
              start_address: sessionData.start_address,
              end_time: sessionData.end_time,
              end_latitude: sessionData.end_latitude,
              end_longitude: sessionData.end_longitude,
              end_address: sessionData.end_address,
              is_active: false
            }]);

          if (error) throw error;
          console.log('Successfully synced complete offline session');
          return true;
        }
      }
    } catch (error) {
      console.error('Error syncing session:', error);
      return false;
    }
  };

  // Function to sync all pending sessions
  const syncPendingSessions = async () => {
    const pendingSessions = getPendingSessions();
    
    if (pendingSessions.length === 0) return;
    
    setIsSyncing(true);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const session of pendingSessions) {
      try {
        const success = await syncSession(session);
        if (success) {
          removePendingSession(session.client_id);
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error during syncing:', error);
        failCount++;
      }
    }
    
    // Show toast notification with results
    if (successCount > 0) {
      toast({
        title: "Sync Completed",
        description: `Successfully synced ${successCount} sessions ${failCount > 0 ? `(${failCount} failed)` : ''}`,
      });
    } else if (failCount > 0) {
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${failCount} sessions`,
        variant: "destructive",
      });
    }
    
    updatePendingCount();
    setIsSyncing(false);
  };

  return {
    isSyncing,
    pendingCount,
    syncPendingSessions,
    updatePendingCount,
    isOnline
  };
};
