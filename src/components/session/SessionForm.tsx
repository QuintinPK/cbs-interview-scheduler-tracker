
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Session, Location, Interview } from "@/types";
import CurrentSessionTime from "./CurrentSessionTime";
import InterviewerCodeInput from "./InterviewerCodeInput";
import ActiveSessionInfo from "./ActiveSessionInfo";
import ActiveInterviewInfo from "../interview/ActiveInterviewInfo";
import InterviewResultDialog from "../interview/InterviewResultDialog";
import { useInterviewActions } from "@/hooks/useInterviewActions";
import ProjectSelectionDialog from "./ProjectSelectionDialog";
import SyncStatus from "./SyncStatus";
import SessionHeader from "./SessionHeader";
import SessionActions from "./SessionActions";
import { useSessionState } from "@/hooks/useSessionState";
import { useProjectManagement } from "@/hooks/useProjectManagement";
import { useSyncManagement } from "@/hooks/useSyncManagement";
import { 
  getInterviewerByCode,
} from "@/lib/offlineDB";

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
  startSession?: (interviewerId: string, projectId: string | null, locationData?: Location) => Promise<Session | null>;
  offlineSessionId?: number | null;
  lastValidatedCode?: string;
  validateInterviewerCode?: () => Promise<boolean>;
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
  startSession,
  offlineSessionId,
  lastValidatedCode,
  validateInterviewerCode
}) => {
  const { toast } = useToast();
  const [interviewerId, setInterviewerId] = useState<string | null>(null);

  const {
    activeInterview,
    isInterviewLoading,
    showResultDialog,
    startInterview,
    stopInterview,
    setInterviewResult,
    cancelResultDialog,
    fetchActiveInterview,
  } = useInterviewActions(activeSession?.id || null, offlineSessionId);

  const { 
    syncState, 
    isOffline, 
    unsyncedCount, 
    unsyncedInterviews, 
    isSyncing, 
    handleManualSync 
  } = useSyncManagement();

  const {
    selectedProjectId,
    setSelectedProjectId,
    availableProjects,
    showProjectDialog,
    setShowProjectDialog,
    activeProject,
    fetchProjects
  } = useProjectManagement(interviewerId, isRunning);

  const {
    loading,
    handleSessionStart,
    handleSessionEnd
  } = useSessionState({
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
  });

  // Set selected project ID when active session has a project ID
  useEffect(() => {
    if (activeSession?.project_id) {
      setSelectedProjectId(activeSession.project_id);
    }
  }, [activeSession, setSelectedProjectId]);

  // Fetch active interview when session changes
  useEffect(() => {
    if (activeSession?.id) {
      fetchActiveInterview();
    }
  }, [activeSession, fetchActiveInterview]);

  // Fetch interviewer ID from interviewer code
  useEffect(() => {
    const getInterviewer = async () => {
      if (!interviewerCode.trim()) {
        setInterviewerId(null);
        return;
      }
      
      try {
        const interviewer = await getInterviewerByCode(interviewerCode);
        
        if (interviewer) {
          setInterviewerId(interviewer.id);
        } else if (lastValidatedCode === interviewerCode) {
          const offlineId = `offline-${interviewerCode}`;
          setInterviewerId(offlineId);
        } else {
          setInterviewerId(null);
        }
      } catch (error) {
        console.error("Error getting interviewer:", error);
        setInterviewerId(null);
      }
    };
    
    getInterviewer();
  }, [interviewerCode, lastValidatedCode]);

  const handleStartStop = async () => {
    if (!interviewerCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter your interviewer code",
        variant: "destructive",
      });
      return;
    }
    
    if (!isRunning) {
      try {
        if (!interviewerId) {
          toast({
            title: "Error",
            description: "Interviewer code not found",
            variant: "destructive",
          });
          return;
        }
        
        if (availableProjects.length === 0) {
          toast({
            title: "Error",
            description: "You are not assigned to any projects",
            variant: "destructive",
          });
          return;
        }
        
        if (availableProjects.length === 1) {
          console.log("Using the only available project:", availableProjects[0].id);
          await handleSessionStart(availableProjects[0].id);
          return;
        }
        
        if (availableProjects.length > 1) {
          console.log("Multiple projects available, showing selection dialog");
          setShowProjectDialog(true);
          return;
        }
      } catch (error) {
        console.error("Error in start session flow:", error);
        toast({
          title: "Error",
          description: "Could not start session",
          variant: "destructive",
        });
      }
    } else {
      await handleSessionEnd(activeInterview);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    console.log("Project selected in dialog:", projectId);
    setSelectedProjectId(projectId);
    setShowProjectDialog(false);
    await handleSessionStart(projectId);
  };

  const handleInterviewAction = async () => {
    if (activeInterview) {
      await stopInterview();
    } else {
      await startInterview(selectedProjectId || undefined);
    }
  };

  return (
    <div className="w-full space-y-6 bg-white p-6 rounded-xl shadow-md">
      <SyncStatus />
      
      <InterviewerCodeInput
        interviewerCode={interviewerCode}
        setInterviewerCode={setInterviewerCode}
        isPrimaryUser={isPrimaryUser}
        isRunning={isRunning}
        loading={loading}
        switchUser={switchUser}
        onLogin={validateInterviewerCode ? () => validateInterviewerCode() : undefined}
      />
      
      <SessionHeader
        unsyncedCount={unsyncedCount}
        unsyncedInterviews={unsyncedInterviews}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
      />
      
      {activeProject && isRunning && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Current Project</p>
          <p className="font-medium">{activeProject.name}</p>
        </div>
      )}
      
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
      
      <SessionActions
        isRunning={isRunning}
        loading={loading}
        interviewerCode={interviewerCode}
        activeInterview={activeInterview}
        isInterviewLoading={isInterviewLoading}
        availableProjects={availableProjects}
        onStartStop={handleStartStop}
        onInterviewAction={handleInterviewAction}
        syncState={syncState}
      />
      
      <InterviewResultDialog
        isOpen={showResultDialog}
        onClose={cancelResultDialog}
        onSelectResult={setInterviewResult}
        isSubmitting={isInterviewLoading}
      />
      
      <ProjectSelectionDialog
        isOpen={showProjectDialog}
        projects={availableProjects}
        onProjectSelect={handleProjectSelect}
        onClose={() => setShowProjectDialog(false)}
      />
    </div>
  );
};

export default SessionForm;
