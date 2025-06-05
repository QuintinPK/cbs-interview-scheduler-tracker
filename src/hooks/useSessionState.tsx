
import { useState, useEffect, useRef, useCallback } from "react";
import { Session, Location } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { isOnline, updateOfflineSession, getInterviewsForOfflineSession } from "@/lib/offlineDB";

interface UseSessionStateProps {
  activeSession: Session | null;
  setActiveSession: (session: Session | null) => void;
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  startTime: string | null;
  setStartTime: (time: string | null) => void;
  startLocation: Location | undefined;
  setStartLocation: (location: Location | undefined) => void;
  endSession: () => void;
  startSession?: (interviewerId: string, projectId: string | null, locationData?: Location) => Promise<Session | null>;
  offlineSessionId?: number | null;
  interviewerCode: string;
  interviewerId: string | null;
}

export const useSessionState = ({
  activeSession,
  setActiveSession,
  isRunning,
  setIsRunning,
  startTime,
  setStartTime,
  startLocation,
  setStartLocation,
  endSession,
  startSession,
  offlineSessionId,
  interviewerCode,
  interviewerId
}: UseSessionStateProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const sessionStartTimeRef = useRef<number | null>(null);

  const handleSessionStart = async (projectId: string) => {
    const startTimePerf = performance.now();
    
    try {
      setLoading(true);
      
      if (!interviewerId) {
        toast({
          title: "Error",
          description: "Interviewer code not found",
          variant: "destructive",
        });
        return;
      }
      
      if (!projectId) {
        console.error("No project ID provided for session start");
        toast({
          title: "Error",
          description: "No project selected. Please select a project first.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Starting session with project ID:", projectId);
      
      const currentLocation = await getCurrentLocation({ highAccuracy: false, timeout: 2000 });

      let session: Session | null = null;
      
      if (!isOnline() && startSession) {
        session = await startSession(interviewerId, projectId, currentLocation);
        if (session) {
          setActiveSession(session);
          setIsRunning(true);
          setStartTime(session.start_time);
          setStartLocation(currentLocation);
          
          getCurrentLocation({ highAccuracy: true, timeout: 10000 })
            .then(betterLocation => {
              if (betterLocation && session) {
                session.start_latitude = betterLocation.latitude;
                session.start_longitude = betterLocation.longitude;
                session.start_address = betterLocation.address;
                setStartLocation(betterLocation);
                
                localStorage.setItem("active_session", JSON.stringify({
                  ...session,
                  offlineId: offlineSessionId
                }));
              }
            })
            .catch(err => console.error("Error getting better location:", err));
            
          toast({
            title: "Session Started",
            description: `Started at ${new Date().toLocaleTimeString()}`,
          });
          
          const endTimePerf = performance.now();
          console.log(`Session start completed in ${endTimePerf - startTimePerf}ms`);
          return;
        }
      }
      
      const { data: sessionData, error: insertError } = await supabase
        .from('sessions')
        .insert([
          {
            interviewer_id: interviewerId,
            project_id: projectId,
            start_latitude: currentLocation?.latitude || null,
            start_longitude: currentLocation?.longitude || null,
            start_address: currentLocation?.address || null,
            is_active: true
          }
        ])
        .select()
        .single();
        
      if (insertError) {
        throw insertError;
      }
      
      console.log("Session created successfully:", sessionData);
      setActiveSession(sessionData);
      setIsRunning(true);
      setStartTime(sessionData.start_time);
      setStartLocation(currentLocation);
      
      toast({
        title: "Session Started",
        description: `Started at ${new Date().toLocaleTimeString()}`,
      });
      
      const endTimePerf = performance.now();
      console.log(`Online session start completed in ${endTimePerf - startTimePerf}ms`);
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Could not start session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionEnd = async (activeInterview: any) => {
    try {
      setLoading(true);
      
      if (activeInterview) {
        toast({
          title: "Error",
          description: "Please stop the active interview before ending your session",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      if (!activeSession && offlineSessionId === null) {
        setLoading(false);
        return;
      }
      
      const currentLocation = await getCurrentLocation();
      
      if (isOnline() && activeSession) {
        const { error: updateError } = await supabase
          .from('sessions')
          .update({
            end_time: new Date().toISOString(),
            end_latitude: currentLocation?.latitude || null,
            end_longitude: currentLocation?.longitude || null,
            end_address: currentLocation?.address || null,
            is_active: false
          })
          .eq('id', activeSession.id);
          
        if (updateError) {
          throw updateError;
        }
      }
      
      await endSession();
      
      toast({
        title: "Session Ended",
        description: `Ended at ${new Date().toLocaleTimeString()}`,
      });
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Could not end session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    sessionStartTimeRef,
    handleSessionStart,
    handleSessionEnd
  };
};
