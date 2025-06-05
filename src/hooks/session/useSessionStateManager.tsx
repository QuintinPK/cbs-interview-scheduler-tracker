
import { useState, useCallback } from "react";
import { Session, Location } from "@/types";

export const useSessionStateManager = () => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<Location | undefined>(undefined);
  const [offlineSessionId, setOfflineSessionId] = useState<number | null>(null);

  // Helper function to update session state
  const updateSessionState = useCallback((session: Session) => {
    setActiveSession(session);
    setIsRunning(true);
    setStartTime(session.start_time);
    
    if (session.start_latitude && session.start_longitude) {
      setStartLocation({
        latitude: session.start_latitude,
        longitude: session.start_longitude,
        address: session.start_address || undefined
      });
    }
  }, []);

  // Helper function to reset session state
  const resetSessionState = useCallback(() => {
    setActiveSession(null);
    setIsRunning(false);
    setStartTime(null);
    setStartLocation(undefined);
    setOfflineSessionId(null);
  }, []);

  return {
    activeSession,
    setActiveSession,
    isRunning,
    setIsRunning,
    startTime,
    setStartTime,
    startLocation,
    setStartLocation,
    offlineSessionId,
    setOfflineSessionId,
    updateSessionState,
    resetSessionState
  };
};
