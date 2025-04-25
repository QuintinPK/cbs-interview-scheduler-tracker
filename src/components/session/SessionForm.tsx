import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation } from "@/lib/utils";
import { Session, Location, Interview, Project } from "@/types";
import CurrentSessionTime from "./CurrentSessionTime";
import InterviewerCodeInput from "./InterviewerCodeInput";
import SessionButton from "./SessionButton";
import ActiveSessionInfo from "./ActiveSessionInfo";
import InterviewButton from "../interview/InterviewButton";
import ActiveInterviewInfo from "../interview/ActiveInterviewInfo";
import InterviewResultDialog from "../interview/InterviewResultDialog";
import { useInterviewActions } from "@/hooks/useInterviewActions";
import ProjectSelector from "../project/ProjectSelector";
import ProjectSelectionDialog from "./ProjectSelectionDialog";
import { useOffline } from "@/contexts/OfflineContext";
import { v4 as uuidv4 } from "uuid";

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
    saveSession, 
    saveProject,
    getProjects,
    saveInterviewerProjects,
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
  const [stoppingSession, setStoppingSession] = useState(false);
  
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
        console.log("Getting interviewer ID for code:", interviewerCode);
        
        const localInterviewers = await getInterviewers();
        const localInterviewer = localInterviewers.find(i => i.code === interviewerCode);
        
        if (localInterviewer) {
          console.log("Found interviewer in local storage:", localInterviewer.id);
          setInterviewerId(localInterviewer.id);
          return;
        }
        
        if (isOnline) {
          const { data, error } = await supabase
            .from('interviewers')
            .select('id')
            .eq('code', interviewerCode)
            .single();
            
          if (error) {
            console.error("Error getting interviewer ID:", error);
            setInterviewerId(null);
            return;
          }
          
          console.log("Found interviewer ID from Supabase:", data.id);
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
        console.log("Fetching projects for interviewer ID:", interviewerId);
        
        const localProjects = await getInterviewerProjects(interviewerId);
        
        if (localProjects && localProjects.length > 0) {
          console.log("Found projects in local storage:", localProjects);
          setAvailableProjects(localProjects);
          
          if (localProjects.length === 1) {
            console.log("Single project found, setting project ID:", localProjects[0].id);
            setSelectedProjectId(localProjects[0].id);
          } else if (localProjects.length > 1 && !isRunning) {
            setSelectedProjectId(null);
          }
          
          return;
        }
        
        if (isOnline) {
          const { data: projectAssignments, error: projectsError } = await supabase
            .from('project_interviewers')
            .select('project_id, projects:project_id(*)')
            .eq('interviewer_id', interviewerId);
            
          if (projectsError) {
            throw projectsError;
          }
          
          if (projectAssignments && projectAssignments.length > 0) {
            const projects = projectAssignments.map(pa => pa.projects as Project);
            console.log("Found projects from Supabase:", projects);
            
            await saveInterviewerProjects(interviewerId, projects);
            for (const project of projects) {
              await saveProject(project);
            }
            
            setAvailableProjects(projects);
            
            if (projects.length === 1) {
              console.log("Single project found, setting project ID:", projects[0].id);
              setSelectedProjectId(projects[0].id);
            } else if (projects.length > 1 && !isRunning) {
              setSelectedProjectId(null);
            }
          } else {
            console.log("No projects found for this interviewer");
            setAvailableProjects([]);
            setSelectedProjectId(null);
          }
        } else {
          setAvailableProjects([]);
          setSelectedProjectId(null);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setAvailableProjects([]);
      }
    };
    
    fetchProjects();
  }, [interviewerId, isRunning, isOnline, getInterviewerProjects, saveInterviewerProjects, saveProject]);

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
          return;
        }
        
        if (isOnline) {
          const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', selectedProjectId)
            .single();
            
          if (error) {
            throw error;
          }
          
          let typedExcludedIslands: ('Bonaire' | 'Saba' | 'Sint Eustatius')[] = [];
          if (Array.isArray(project.excluded_islands)) {
            typedExcludedIslands = project.excluded_islands.filter((island: string) => 
              island === 'Bonaire' || island === 'Saba' || island === 'Sint Eustatius'
            ) as ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
          }
          
          const projectData: Project = {
            id: project.id,
            name: project.name,
            start_date: project.start_date,
            end_date: project.end_date,
            excluded_islands: typedExcludedIslands
          };
          
          await saveProject(projectData);
          
          setActiveProject(projectData);
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        setActiveProject(null);
      }
    };
    
    fetchActiveProject();
  }, [selectedProjectId, availableProjects, getProjects, isOnline, saveProject]);

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
        setLoading(true);
        
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
      } finally {
        setLoading(false);
      }
    } else {
      if (!stoppingSession) {
        await handleSessionEnd();
      }
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    console.log("Project selected in dialog:", projectId);
    setSelectedProjectId(projectId);
    setShowProjectDialog(false);
    
    await handleSessionStart(projectId);
  };

  const handleSessionStart = async (projectId: string) => {
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
      console.log("Interviewer ID:", interviewerId);
      
      const currentLocation = await getCurrentLocation();
      console.log("Current location:", currentLocation);
      
      const newSession: Session = {
        id: uuidv4(),
        interviewer_id: interviewerId,
        project_id: projectId,
        start_time: new Date().toISOString(),
        end_time: null,
        start_latitude: currentLocation?.latitude || null,
        start_longitude: currentLocation?.longitude || null,
        start_address: currentLocation?.address || null,
        end_latitude: null,
        end_longitude: null,
        end_address: null,
        is_active: true,
        is_unusual_reviewed: false,
        sync_status: 'unsynced',
        local_id: uuidv4()
      };
      
      if (isOnline) {
        try {
          const { data: session, error: insertError } = await supabase
            .from('sessions')
            .insert([{
              interviewer_id: interviewerId,
              project_id: projectId,
              start_latitude: currentLocation?.latitude || null,
              start_longitude: currentLocation?.longitude || null,
              start_address: currentLocation?.address || null,
              is_active: true
            }])
            .select()
            .single();
            
          if (!insertError && session) {
            newSession.id = session.id;
            newSession.sync_status = 'synced';
            console.log("Successfully created session on server:", session.id);
          } else {
            console.error("Error inserting session on server:", insertError);
          }
        } catch (error) {
          console.error("Error creating session on server, proceeding with local only:", error);
        }
      }

      const savedSession = await saveSession(newSession);
      console.log("Session saved locally:", savedSession);
      
      setActiveSession(savedSession);
      setIsRunning(true);
      setStartTime(savedSession.start_time);
      setStartLocation(currentLocation);
      
      toast({
        title: "Session Started",
        description: `Started at ${new Date().toLocaleTimeString()}`,
      });
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

  const handleSessionEnd = async () => {
    try {
      if (stoppingSession) return; // Prevent multiple stop attempts
      
      setLoading(true);
      setStoppingSession(true);
      
      if (activeInterview) {
        toast({
          title: "Active Interview",
          description: "Stopping active interview before ending session...",
        });
        
        try {
          const stopSuccess = await stopInterview();
          
          if (stopSuccess === false) {
            setLoading(false);
            return; // Will be called again after interview is fully completed
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (interviewError) {
          console.error("Error stopping interview:", interviewError);
        }
      }
      
      if (!activeSession) {
        setStoppingSession(false);
        setLoading(false);
        return;
      }
      
      const currentLocation = await getCurrentLocation();
      
      const updatedSession: Session = {
        ...activeSession,
        end_time: new Date().toISOString(),
        end_latitude: currentLocation?.latitude || null,
        end_longitude: currentLocation?.longitude || null,
        end_address: currentLocation?.address || null,
        is_active: false,
        sync_status: 'unsynced'
      };
      
      await saveSession(updatedSession);
      
      if (isOnline && activeSession.sync_status === 'synced') {
        try {
          await supabase
            .from('sessions')
            .update({
              end_time: new Date().toISOString(),
              end_latitude: currentLocation?.latitude || null,
              end_longitude: currentLocation?.longitude || null,
              end_address: currentLocation?.address || null,
              is_active: false
            })
            .eq('id', activeSession.id);
        } catch (error) {
          console.error("Error updating session on server:", error);
        }
      }
      
      endSession();
      
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
      setStoppingSession(false);
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
            disabled={loading || stoppingSession}
          />
        )}
        
        <SessionButton
          isRunning={isRunning}
          loading={loading}
          interviewerCode={interviewerCode && interviewerVerified ? interviewerCode : ""}
          onClick={handleStartStop}
          disabled={stoppingSession}
          disabledReason={stoppingSession ? "Stopping session..." : undefined}
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
