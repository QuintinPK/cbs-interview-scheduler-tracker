import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation } from "@/lib/utils";
import { Session, Location, Interview } from "@/types";
import CurrentSessionTime from "./CurrentSessionTime";
import InterviewerCodeInput from "./InterviewerCodeInput";
import SessionButton from "./SessionButton";
import ActiveSessionInfo from "./ActiveSessionInfo";
import InterviewButton from "../interview/InterviewButton";
import ActiveInterviewInfo from "../interview/ActiveInterviewInfo";
import InterviewResultDialog from "../interview/InterviewResultDialog";
import { useInterviewActions } from "@/hooks/useInterviewActions";

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
  endSession
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const {
    activeInterview,
    isInterviewLoading,
    showResultDialog,
    startInterview,
    stopInterview,
    setInterviewResult,
    cancelResultDialog,
    fetchActiveInterview
  } = useInterviewActions(activeSession?.id || null);

  useEffect(() => {
    if (activeSession?.id) {
      fetchActiveInterview(activeSession.id);
    }
  }, [activeSession]);

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
      
      const interviewerId = interviewers[0].id;
      
      if (!isRunning) {
        const currentLocation = await getCurrentLocation();
        
        const { data: session, error: insertError } = await supabase
          .from('sessions')
          .insert([
            {
              interviewer_id: interviewerId,
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
        
        toast({
          title: "Session Started",
          description: `Started at ${new Date().toLocaleTimeString()}`,
        });
      } else {
        if (activeInterview) {
          toast({
            title: "Error",
            description: "Please stop the active interview before ending your session",
            variant: "destructive",
          });
          return;
        }
        
        const currentLocation = await getCurrentLocation();
        
        if (!activeSession) return;
        
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
        
        endSession();
        
        toast({
          title: "Session Ended",
          description: `Ended at ${new Date().toLocaleTimeString()}`,
        });
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

  const handleInterviewAction = async () => {
    if (activeInterview) {
      await stopInterview();
    } else {
      await startInterview();
    }
  };

  return (
    <div className="w-full space-y-6 bg-white p-6 rounded-xl shadow-md">
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
      />
      
      {isRunning && activeInterview && (
        <ActiveInterviewInfo 
          activeInterview={activeInterview} 
          startLocation={
            activeInterview.start_latitude && activeInterview.start_longitude
              ? {
                  latitude: activeInterview.start_latitude,
                  longitude: activeInterview.start_longitude,
                  address: activeInterview.start_address || undefined
                }
              : undefined
          }
        />
      )}
      
      <div className="flex flex-col gap-4">
        {isRunning && (
          <InterviewButton
            isInterviewActive={!!activeInterview}
            loading={isInterviewLoading}
            onClick={handleInterviewAction}
            disabled={loading}
          />
        )}
        
        <SessionButton
          isRunning={isRunning}
          loading={loading}
          interviewerCode={interviewerCode}
          onClick={handleStartStop}
          disabled={isRunning && !!activeInterview}
        />
      </div>
      
      <InterviewResultDialog
        isOpen={showResultDialog}
        onClose={cancelResultDialog}
        onSelectResult={setInterviewResult}
        isSubmitting={isInterviewLoading}
      />
    </div>
  );
};

export default SessionForm;
