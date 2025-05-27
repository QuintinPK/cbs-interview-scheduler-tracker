
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Session } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getActiveSyncLock, isOnline, saveOfflineSession, getInterviewerByCode, cacheInterviewer } from '@/lib/offlineDB';
import { getCurrentLocation } from '@/lib/utils';
import { getSyncManager } from '@/lib/sync';

export const useActiveSession = (interviewerCode: string | null) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isStoppingSession, setIsStoppingSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: cachedInterviewer } = useQuery({
    queryKey: ['interviewer', interviewerCode],
    queryFn: async () => {
      if (!interviewerCode || interviewerCode.trim() === '') {
        throw new Error('Interviewer code is required');
      }
      
      let interviewer = await getInterviewerByCode(interviewerCode);
      
      if (!interviewer) {
        // Try to fetch from API if online
        if (isOnline()) {
          const { data, error } = await supabase
            .from('interviewers')
            .select('*')
            .eq('code', interviewerCode)
            .single();
            
          if (error) {
            throw new Error(`Interviewer with code ${interviewerCode} not found`);
          }
          
          // Cache the interviewer
          await cacheInterviewer(data);
          interviewer = data;
        } else {
          throw new Error(`Interviewer with code ${interviewerCode} not found offline`);
        }
      }
      
      return interviewer;
    },
    enabled: !!interviewerCode && interviewerCode.trim() !== '',
    retry: false
  });
  
  // Load active session on mount
  useEffect(() => {
    const loadActiveSession = async () => {
      if (!cachedInterviewer?.id) return;
      setIsLoading(true);
      
      try {
        // Check for active session in local storage
        const storedSession = localStorage.getItem('activeSession');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          setActiveSession(parsedSession);
          return;
        }
        
        // If not in local storage, check the database
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', cachedInterviewer.id)
          .eq('is_active', true)
          .single();
          
        if (error && error.message.indexOf('single row') === -1) {
          throw error;
        }
        
        if (data) {
          setActiveSession(data);
          localStorage.setItem('activeSession', JSON.stringify(data));
        } else {
          setActiveSession(null);
          localStorage.removeItem('activeSession');
        }
      } catch (error) {
        console.error("Error loading active session:", error);
        toast({
          title: "Error",
          description: "Could not load active session",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadActiveSession();
  }, [cachedInterviewer?.id, toast]);
  
  // Start a new session
  const startSession = useCallback(async (projectId?: string) => {
    if (!cachedInterviewer?.id) {
      toast({
        title: "Error",
        description: "Interviewer data not loaded yet",
        variant: "destructive",
      });
      return;
    }
    
    setIsStartingSession(true);
    try {
      // Get current location
      let currentLocation;
      try {
        currentLocation = await getCurrentLocation();
      } catch (locationError: any) {
        console.warn("Could not get location:", locationError.message);
        toast({
          title: "Location Access Denied",
          description: "Please enable location access to start a session. You can continue without location data.",
          variant: "destructive",
        });
      }
      
      const startTime = new Date().toISOString();
      
      // Create session data
      const sessionData = {
        interviewer_id: cachedInterviewer.id,
        project_id: projectId,
        start_time: startTime,
        start_latitude: currentLocation?.latitude || null,
        start_longitude: currentLocation?.longitude || null,
        start_address: currentLocation?.address || null,
        is_active: true
      };
      
      // If online, create session in Supabase
      if (isOnline()) {
        const { data, error } = await supabase
          .from('sessions')
          .insert([sessionData])
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        setActiveSession(data);
        localStorage.setItem('activeSession', JSON.stringify(data));
        
        toast({
          title: "Session Started",
          description: "New session started successfully",
        });
      } else {
        // If offline, create session in local storage
        const offlineId = await saveOfflineSession(sessionData, cachedInterviewer, projectId || '', currentLocation);
        
        // Create a temporary session object
        const tempSession: Session = {
          id: `temp-${Date.now()}`,
          offlineId: offlineId,
          interviewer_id: cachedInterviewer.id,
          project_id: projectId,
          start_time: startTime,
          start_latitude: currentLocation?.latitude || null,
          start_longitude: currentLocation?.longitude || null,
          start_address: currentLocation?.address || null,
          is_active: true
        };
        
        setActiveSession(tempSession);
        localStorage.setItem('activeSession', JSON.stringify(tempSession));
        
        // Queue sync operation
        const syncManager = getSyncManager();
        await syncManager.queueOperation(
          'SESSION_START',
          sessionData,
          {
            offlineId: offlineId,
            entityType: 'session'
          }
        );
        
        toast({
          title: "Session Started (Offline)",
          description: "New session started offline. It will be synced when online.",
        });
      }
      
      navigate('/interview');
    } catch (error: any) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: `Could not start session: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsStartingSession(false);
    }
  }, [cachedInterviewer?.id, navigate, toast]);
  
  // Stop the active session
  const stopSession = useCallback(async () => {
    if (!activeSession) {
      toast({
        title: "No Active Session",
        description: "No active session to stop",
        variant: "destructive",
      });
      return;
    }
    
    setIsStoppingSession(true);
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
      
      // If online, update session in Supabase
      if (isOnline()) {
        const { error } = await supabase
          .from('sessions')
          .update(sessionEndData)
          .eq('id', activeSession.id);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Session Stopped",
          description: "Session stopped successfully",
        });
      } else {
        // If offline, update session in local storage
        
        // Queue sync operation
        const syncManager = getSyncManager();
        syncManager.queueOperation(
          'SESSION_END',
          sessionEndData,
          {
            onlineId: activeSession.id,
            entityType: 'session'
          }
        );
        
        toast({
          title: "Session Stopped (Offline)",
          description: "Session stopped offline. It will be synced when online.",
        });
      }
      
      setActiveSession(null);
      localStorage.removeItem('activeSession');
      navigate('/');
    } catch (error: any) {
      console.error("Error stopping session:", error);
      toast({
        title: "Error",
        description: `Could not stop session: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsStoppingSession(false);
    }
  }, [activeSession, navigate, toast]);
  
  return {
    activeSession,
    isLoading,
    isStartingSession,
    isStoppingSession,
    startSession,
    stopSession
  };
};
