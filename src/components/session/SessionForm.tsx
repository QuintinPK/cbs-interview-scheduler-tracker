
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation } from "@/lib/utils";
import { Session, Location } from "@/types";
import CurrentSessionTime from "./CurrentSessionTime";
import InterviewerCodeInput from "./InterviewerCodeInput";
import SessionButton from "./SessionButton";
import ActiveSessionInfo from "./ActiveSessionInfo";
import { useSyncManager } from "@/hooks/useSyncManager";
import { 
  saveActiveOfflineSession,
  clearActiveOfflineSession,
  savePendingSession
} from "@/lib/offlineStorage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionFormProps {
  interviewerCode: string;
  setInterviewerCode: (code: string) => void;
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  startTime: string | null;
  setStartTime: (time: string | null) => void;
  startLocation: Location | undefined;
  setStartLocation: (location: Location | undefined) => void;
  activeSession: Session | null;
  setActiveSession: (session: Session | null) => void;
  isPrimaryUser: boolean;
  switchUser: () => void;
  endSession: () => void;
  isOfflineSession: boolean;
  setIsOfflineSession: (isOffline: boolean) => void;
  interviewerId: string | null;
  isOnline: boolean;
}

const SessionForm: React.FC<SessionFormProps> = ({
  interviewerCode,
  setInterviewerCode,
  isRunning,
  setIsRunning,
  startTime,
  setStartTime,
  startLocation,
  setStartLocation,
  activeSession,
  setActiveSession,
  isPrimaryUser,
  switchUser,
  endSession,
  isOfflineSession,
  setIsOfflineSession,
  interviewerId,
  isOnline
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { 
    isSyncing, 
    pendingCount, 
    syncPendingSessions,
    updatePendingCount
  } = useSyncManager();

  useEffect(() => {
    // Update pending count when component mounts
    updatePendingCount();
  }, [updatePendingCount]);

  const handleStartStop = async () => {
    if (!interviewerCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter your interviewer code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // If we're online, proceed with normal flow
      if (isOnline) {
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .limit(1);
          
        if (interviewerError) throw interviewerError;
        
        if (!interviewers || interviewers.length === 0) {
          toast({
            title: "Error",
            description: "Interviewer code not found",
            variant: "destructive",
          });
          return;
        }
        
        const currentInterviewerId = interviewers[0].id;
        
        if (!isRunning) {
          // Starting a session online
          const currentLocation = await getCurrentLocation();
          
          const { data: session, error: insertError } = await supabase
            .from('sessions')
            .insert([
              {
                interviewer_id: currentInterviewerId,
                start_latitude: currentLocation?.latitude || null,
                start_longitude: currentLocation?.longitude || null,
                start_address: currentLocation?.address || null,
                is_active: true
              }
            ])
            .select()
            .single();
            
          if (insertError) throw insertError;
          
          setActiveSession(session);
          setIsRunning(true);
          setStartTime(session.start_time);
          setStartLocation(currentLocation);
          setIsOfflineSession(false);
          
          toast({
            title: "Session Started",
            description: `Started at ${new Date().toLocaleTimeString()}`,
          });
        } else {
          // Stopping a session online
          const currentLocation = await getCurrentLocation();
          
          if (!activeSession) return;
          
          // If it's an offline session, sync it
          if (isOfflineSession) {
            // Create a pending session to sync
            savePendingSession({
              interviewer_id: currentInterviewerId,
              start_time: startTime || new Date().toISOString(),
              start_latitude: startLocation?.latitude || null,
              start_longitude: startLocation?.longitude || null,
              start_address: startLocation?.address || null,
              end_time: new Date().toISOString(),
              end_latitude: currentLocation?.latitude || null,
              end_longitude: currentLocation?.longitude || null,
              end_address: currentLocation?.address || null,
              is_active: false
            });
            
            // Clear offline session
            clearActiveOfflineSession();
            
            // Try to sync immediately since we're online
            await syncPendingSessions();
          } else {
            // It's an online session, update it normally
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
              
            if (updateError) throw updateError;
          }
          
          // Use endSession to reset state
          endSession();
          
          toast({
            title: "Session Ended",
            description: `Ended at ${new Date().toLocaleTimeString()}`,
          });
        }
      } else {
        // Offline mode
        // First, check if we have a cached interviewer_id
        let knownInterviewerId = interviewerId;
        
        // If not, we'll create a temporary one based on the code
        if (!knownInterviewerId) {
          knownInterviewerId = `offline_${interviewerCode}_${Date.now()}`;
        }
        
        if (!isRunning) {
          // Starting a session offline
          const currentLocation = await getCurrentLocation();
          const now = new Date().toISOString();
          
          // Save to local storage
          saveActiveOfflineSession(
            knownInterviewerId,
            now,
            currentLocation
          );
          
          // Update state
          setIsRunning(true);
          setStartTime(now);
          setStartLocation(currentLocation);
          setIsOfflineSession(true);
          setActiveSession({
            id: 'offline',
            interviewer_id: knownInterviewerId,
            start_time: now,
            start_latitude: currentLocation?.latitude || null,
            start_longitude: currentLocation?.longitude || null,
            start_address: currentLocation?.address || null,
            end_time: null,
            end_latitude: null,
            end_longitude: null,
            end_address: null,
            is_active: true
          } as Session);
          
          toast({
            title: "Offline Session Started",
            description: `Started at ${new Date().toLocaleTimeString()} (offline)`,
          });
        } else {
          // Stopping a session offline
          const currentLocation = await getCurrentLocation();
          const now = new Date().toISOString();
          
          // Save the complete session as a pending session
          savePendingSession({
            interviewer_id: knownInterviewerId,
            start_time: startTime || now,
            start_latitude: startLocation?.latitude || null,
            start_longitude: startLocation?.longitude || null,
            start_address: startLocation?.address || null,
            end_time: now,
            end_latitude: currentLocation?.latitude || null,
            end_longitude: currentLocation?.longitude || null,
            end_address: currentLocation?.address || null,
            is_active: false
          });
          
          // Clear the active offline session
          clearActiveOfflineSession();
          
          // Reset state
          endSession();
          
          toast({
            title: "Offline Session Ended",
            description: `Ended at ${new Date().toLocaleTimeString()} (will sync when online)`,
          });
          
          // Update pending count
          updatePendingCount();
        }
      }
    } catch (error) {
      console.error("Error managing session:", error);
      toast({
        title: "Error",
        description: "Could not manage session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 bg-white p-6 rounded-xl shadow-md">
      {!isOnline && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-300">
          <WifiOff className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700">
            You are currently offline. Session data will be saved locally and synced when you're back online.
          </AlertDescription>
        </Alert>
      )}
      
      {isOnline && pendingCount > 0 && (
        <Alert className="bg-blue-50 border-blue-300">
          <AlertDescription className="text-blue-700 flex justify-between items-center">
            <span>You have {pendingCount} session{pendingCount > 1 ? 's' : ''} waiting to be synced.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={syncPendingSessions}
              disabled={isSyncing}
              className="border-blue-300 text-blue-700"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Sync Now
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <InterviewerCodeInput
        interviewerCode={interviewerCode}
        setInterviewerCode={setInterviewerCode}
        isPrimaryUser={isPrimaryUser}
        isRunning={isRunning}
        loading={loading}
        switchUser={switchUser}
      />
      
      <CurrentSessionTime startTime={startTime} isRunning={isRunning} />
      
      <ActiveSessionInfo
        isRunning={isRunning}
        startTime={startTime}
        startLocation={startLocation}
        isOffline={isOfflineSession}
      />
      
      <SessionButton
        isRunning={isRunning}
        loading={loading}
        interviewerCode={interviewerCode}
        onClick={handleStartStop}
        isOffline={!isOnline}
      />
    </div>
  );
};

export default SessionForm;
