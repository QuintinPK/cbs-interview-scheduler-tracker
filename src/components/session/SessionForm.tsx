
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [interviewerId, setInterviewerId] = useState<string | undefined>(undefined);
  const [projectDialogStep, setProjectDialogStep] = useState<'init' | 'pending' | 'complete'>('init');

  // Set selected project ID when active session has a project ID
  useEffect(() => {
    if (activeSession?.project_id) {
      setSelectedProjectId(activeSession.project_id);
    }
  }, [activeSession]);
  
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
  }, [activeSession, fetchActiveInterview]);

  // Add effect to fetch the active project details
  useEffect(() => {
    const fetchActiveProject = async () => {
      if (!selectedProjectId) return;
      
      try {
        const { data: project, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', selectedProjectId)
          .single();
          
        if (error) throw error;
        
        // Cast the excluded_islands to the correct type
        setActiveProject({
          id: project.id,
          name: project.name,
          start_date: project.start_date,
          end_date: project.end_date,
          excluded_islands: (project.excluded_islands || []) as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
        });
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };
    
    fetchActiveProject();
  }, [selectedProjectId]);

  // Get interviewer ID when code changes
  useEffect(() => {
    const getInterviewerId = async () => {
      if (!interviewerCode.trim()) {
        setInterviewerId(undefined);
        return;
      }
      
      try {
        console.log("Getting interviewer ID for code:", interviewerCode);
        const { data, error } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .single();
          
        if (error) {
          console.error("Error getting interviewer ID:", error);
          setInterviewerId(undefined);
          return;
        }
        
        console.log("Found interviewer ID:", data.id);
        setInterviewerId(data.id);
      } catch (error) {
        console.error("Error getting interviewer ID:", error);
        setInterviewerId(undefined);
      }
    };
    
    getInterviewerId();
  }, [interviewerCode]);

  // Effect to fetch available projects when interviewer ID changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (!interviewerId || isRunning) return;
      
      try {
        console.log("Fetching projects for interviewer ID:", interviewerId);
        // Get assigned projects
        const { data: projectAssignments, error: projectsError } = await supabase
          .from('project_interviewers')
          .select('project_id, projects:project_id(*)')
          .eq('interviewer_id', interviewerId);
          
        if (projectsError) throw projectsError;
        
        if (projectAssignments && projectAssignments.length > 0) {
          const projects = projectAssignments.map(pa => pa.projects as Project);
          console.log("Found projects:", projects);
          setAvailableProjects(projects);
          
          if (projects.length === 1) {
            console.log("Single project found, setting project ID:", projects[0].id);
            setSelectedProjectId(projects[0].id);
            setProjectDialogStep('complete');
          } else if (projects.length > 1) {
            // Reset selected project when user has multiple projects
            setSelectedProjectId(undefined);
            // Show project selection dialog immediately if not running
            if (!isRunning && projectDialogStep === 'init') {
              console.log("Multiple projects found, showing selection dialog");
              setShowProjectDialog(true);
              setProjectDialogStep('pending');
            }
          } else {
            setSelectedProjectId(undefined);
            setProjectDialogStep('complete');
          }
        } else {
          // No projects assigned
          console.log("No projects found for this interviewer");
          setAvailableProjects([]);
          setSelectedProjectId(undefined);
          setProjectDialogStep('complete');
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    
    fetchProjects();
  }, [interviewerId, isRunning, projectDialogStep]);

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
        setLoading(true);
        
        if (!interviewerId) {
          toast({
            title: "Error",
            description: "Interviewer code not found",
            variant: "destructive",
          });
          return;
        }
        
        // Check projects
        if (availableProjects.length === 0) {
          toast({
            title: "Error",
            description: "You are not assigned to any projects",
            variant: "destructive",
          });
          return;
        }
        
        if (availableProjects.length > 1 && !selectedProjectId) {
          console.log("Multiple projects but no selection, showing dialog");
          setShowProjectDialog(true);
          setProjectDialogStep('pending');
          return;
        }
        
        if (!selectedProjectId) {
          if (availableProjects.length === 1) {
            console.log("Auto-selecting the only available project:", availableProjects[0].id);
            setSelectedProjectId(availableProjects[0].id);
          } else {
            toast({
              title: "Error",
              description: "Please select a project",
              variant: "destructive",
            });
            return;
          }
        }
      } catch (error) {
        console.error("Error checking projects:", error);
        toast({
          title: "Error",
          description: "Could not check project assignments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      
      if (projectDialogStep === 'complete' || availableProjects.length === 1) {
        // Continue with session start
        console.log("Proceeding with session start, selected project:", selectedProjectId);
        handleSessionStart();
      }
    } else {
      // Handle session end
      handleSessionEnd();
    }
  };

  const handleSessionStart = async () => {
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
      
      if (!selectedProjectId) {
        console.error("No project selected for session start");
        toast({
          title: "Error",
          description: "No project selected. Please select a project first.",
          variant: "destructive",
        });
        return;
      }
      
      const currentLocation = await getCurrentLocation();
      
      // Log the project ID being used for debugging
      console.log("Starting session with project ID:", selectedProjectId);
      
      const { data: session, error: insertError } = await supabase
        .from('sessions')
        .insert([
          {
            interviewer_id: interviewerId,
            project_id: selectedProjectId,
            start_latitude: currentLocation?.latitude || null,
            start_longitude: currentLocation?.longitude || null,
            start_address: currentLocation?.address || null,
            is_active: true
          }
        ])
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      console.log("Session created:", session);
      setActiveSession(session);
      setIsRunning(true);
      setStartTime(session.start_time);
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
      setLoading(true);
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

  const handleProjectSelect = (projectId: string) => {
    console.log("Project selected:", projectId);
    setSelectedProjectId(projectId);
    setShowProjectDialog(false);
    setProjectDialogStep('complete');
    // Start session after project selection is complete
    setTimeout(() => {
      handleSessionStart();
    }, 100);
  };

  const handleInterviewAction = async () => {
    if (activeInterview) {
      await stopInterview();
    } else {
      await startInterview(selectedProjectId);
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
      
      <ProjectSelectionDialog
        isOpen={showProjectDialog}
        projects={availableProjects}
        onProjectSelect={handleProjectSelect}
        onClose={() => {
          setShowProjectDialog(false);
          setProjectDialogStep('init');
        }}
      />
    </div>
  );
};

export default SessionForm;
