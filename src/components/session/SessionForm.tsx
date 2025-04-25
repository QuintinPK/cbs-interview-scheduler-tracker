
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Session, Location, Project } from "@/types";
import CurrentSessionTime from "./CurrentSessionTime";
import InterviewerCodeInput from "./InterviewerCodeInput";
import SessionButton from "./SessionButton";
import ActiveSessionInfo from "./ActiveSessionInfo";
import InterviewButton from "../interview/InterviewButton";
import ActiveInterviewInfo from "../interview/ActiveInterviewInfo";
import InterviewResultDialog from "../interview/InterviewResultDialog";
import { useInterviewActions } from "@/hooks/useInterviewActions";
import ProjectSelectionDialog from "./ProjectSelectionDialog";
import { useOffline } from "@/contexts/OfflineContext";
import { useSessionActions } from "@/hooks/useSessionActions";

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
  verifyInterviewerCode?: (code: string) => Promise<boolean>;
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
  verifyInterviewerCode
}) => {
  const { toast } = useToast();
  const { 
    isOnline, 
    getProjects,
    getInterviewerProjects,
    getInterviewers
  } = useOffline();
  
  const [loading, setLoading] = useState(false);
  const [interviewerId, setInterviewerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [interviewerVerified, setInterviewerVerified] = useState(false);
  
  const { startSession, stopSession } = useSessionActions(setLoading, toast);
  
  const {
    activeInterview,
    isInterviewLoading,
    showResultDialog,
    startInterview,
    stopInterview,
    setInterviewResult,
    cancelResultDialog,
    fetchActiveInterview,
    isStoppingInProgress
  } = useInterviewActions(activeSession?.id || null);

  useEffect(() => {
    if (activeSession?.project_id) {
      setSelectedProjectId(activeSession.project_id);
    }
  }, [activeSession]);

  useEffect(() => {
    if (activeSession?.id) {
      fetchActiveInterview(activeSession.id);
    }
  }, [activeSession, fetchActiveInterview]);

  useEffect(() => {
    const getInterviewerId = async () => {
      if (!interviewerCode.trim() || !interviewerVerified) {
        setInterviewerId(null);
        return;
      }
      
      try {
        const localInterviewers = await getInterviewers();
        const localInterviewer = localInterviewers.find(i => i.code === interviewerCode);
        
        if (localInterviewer) {
          setInterviewerId(localInterviewer.id);
          return;
        }
        
        if (isOnline) {
          const { data, error } = await fetch('interviewers')
            .from('interviewers')
            .select('id')
            .eq('code', interviewerCode)
            .single();
            
          if (error) {
            console.error("Error getting interviewer ID:", error);
            setInterviewerId(null);
            return;
          }
          
          setInterviewerId(data.id);
        } else {
          setInterviewerId(interviewerCode);
        }
      } catch (error) {
        console.error("Error getting interviewer ID:", error);
        setInterviewerId(null);
      }
    };
    
    getInterviewerId();
  }, [interviewerCode, isOnline, getInterviewers, interviewerVerified]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!interviewerId) {
        setAvailableProjects([]);
        return;
      }
      
      try {
        const localProjects = await getInterviewerProjects(interviewerId);
        
        if (localProjects && localProjects.length > 0) {
          setAvailableProjects(localProjects);
          
          if (localProjects.length === 1) {
            setSelectedProjectId(localProjects[0].id);
          } else if (localProjects.length > 1 && !isRunning) {
            setSelectedProjectId(null);
          }
          
          return;
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setAvailableProjects([]);
      }
    };
    
    fetchProjects();
  }, [interviewerId, isRunning, getInterviewerProjects]);

  useEffect(() => {
    const fetchActiveProject = async () => {
      if (!selectedProjectId) {
        setActiveProject(null);
        return;
      }
      
      try {
        const projectFromAvailable = availableProjects.find(p => p.id === selectedProjectId);
        
        if (projectFromAvailable) {
          setActiveProject(projectFromAvailable);
          return;
        }
        
        const localProjects = await getProjects();
        const projectFromLocal = localProjects.find(p => p.id === selectedProjectId);
        
        if (projectFromLocal) {
          setActiveProject(projectFromLocal);
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        setActiveProject(null);
      }
    };
    
    fetchActiveProject();
  }, [selectedProjectId, availableProjects, getProjects]);

  const handleStartStop = async () => {
    if (!interviewerCode.trim() || !interviewerVerified) {
      toast({
        title: "Error",
        description: "Please verify your interviewer code first",
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
            description: isOnline ? 
              "You are not assigned to any projects" : 
              "No projects available offline. Please connect to internet first",
            variant: "destructive",
          });
          return;
        }
        
        if (availableProjects.length === 1) {
          await handleSessionStart(availableProjects[0].id);
          return;
        }
        
        if (availableProjects.length > 1) {
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
      await handleSessionEnd();
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowProjectDialog(false);
    
    await handleSessionStart(projectId);
  };

  const handleSessionStart = async (projectId: string) => {
    if (!interviewerId) {
      toast({
        title: "Error",
        description: "Interviewer code not found",
        variant: "destructive",
      });
      return;
    }
    
    if (!projectId) {
      toast({
        title: "Error",
        description: "No project selected. Please select a project first.",
        variant: "destructive",
      });
      return;
    }
    
    const session = await startSession(interviewerId, projectId);
    
    if (session) {
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
    }
  };

  const handleSessionEnd = async () => {
    if (isInterviewLoading) return;
    
    // Check if there's an active interview that needs to be stopped first
    if (activeInterview) {
      setLoading(true);
      toast({
        title: "Active Interview",
        description: "Stopping active interview before ending session...",
      });
      
      const interviewStopped = await stopInterview();
      setLoading(false);
      
      if (interviewStopped === false) {
        // Interview stopping is in progress, need to complete it first
        return;
      }
    }
    
    if (!activeSession) return;
    
    setLoading(true);
    const success = await stopSession(activeSession);
    setLoading(false);
    
    if (success) {
      endSession();
    }
  };

  const handleInterviewAction = async () => {
    if (activeInterview) {
      await stopInterview();
    } else {
      await startInterview(selectedProjectId || undefined);
    }
  };

  const handleVerifySuccess = () => {
    setInterviewerVerified(true);
  };

  // Check if session stopping is in progress (interview stopping dialog showing)
  const isSessionStoppingInProgress = isStoppingInProgress();

  return (
    <div className="w-full space-y-6 bg-white p-6 rounded-xl shadow-md">
      <InterviewerCodeInput
        interviewerCode={interviewerCode}
        setInterviewerCode={setInterviewerCode}
        isPrimaryUser={isPrimaryUser}
        isRunning={isRunning}
        loading={loading}
        switchUser={switchUser}
        verifyInterviewerCode={verifyInterviewerCode}
        onVerify={handleVerifySuccess}
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
      
      {isRunning && activeSession?.sync_status === 'unsynced' && (
        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm mt-2">
          <p className="font-medium">This session hasn't been synced yet</p>
          <p className="text-xs">It will automatically sync when you go online</p>
        </div>
      )}
      
      {isRunning && activeInterview?.sync_status === 'unsynced' && (
        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm mt-2">
          <p className="font-medium">This interview hasn't been synced yet</p>
          <p className="text-xs">It will automatically sync when you go online</p>
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        {isRunning && (
          <InterviewButton
            isInterviewActive={!!activeInterview}
            loading={isInterviewLoading}
            onClick={handleInterviewAction}
            disabled={loading || isSessionStoppingInProgress}
          />
        )}
        
        <SessionButton
          isRunning={isRunning}
          loading={loading || isInterviewLoading}
          interviewerCode={interviewerCode && interviewerVerified ? interviewerCode : ""}
          onClick={handleStartStop}
          disabled={isSessionStoppingInProgress || isInterviewLoading}
          disabledReason={isSessionStoppingInProgress ? "Complete interview result first" : undefined}
        />
      </div>
      
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

      {!isOnline && !isRunning && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
          <p className="font-medium">Offline Mode</p>
          <p className="text-sm">
            You're working offline. All data will be saved locally and synchronized when you go online again.
          </p>
        </div>
      )}
    </div>
  );
};

export default SessionForm;
