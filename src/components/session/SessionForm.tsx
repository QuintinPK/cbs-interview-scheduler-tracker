import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
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
import { 
  isOnline, 
  syncOfflineSessions, 
  getUnsyncedSessionsCount,
  getUnsyncedInterviewsCount,
  cacheInterviewer,
  getInterviewerByCode,
  cacheProjects,
  getCachedProjects
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
  validateInterviewerCode?: () => Promise<boolean>; // New prop
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
  validateInterviewerCode // New prop
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [interviewerId, setInterviewerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  const {
    activeInterview,
    isInterviewLoading,
    showResultDialog,
    startInterview,
    stopInterview,
    setInterviewResult,
    cancelResultDialog,
    fetchActiveInterview,
    offlineInterviews
  } = useInterviewActions(activeSession?.id || null, offlineSessionId);

  // Set selected project ID when active session has a project ID
  useEffect(() => {
    if (activeSession?.project_id) {
      setSelectedProjectId(activeSession.project_id);
    }
  }, [activeSession]);

  // Fetch active interview when session changes
  useEffect(() => {
    if (activeSession?.id) {
      fetchActiveInterview(activeSession.id);
    }
  }, [activeSession, fetchActiveInterview]);

  // Fetch interviewer ID from interviewer code (with offline support)
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
          // If we've already validated this code before, trust it
          // This helps when going offline with a code we've used before
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

  // Fetch available projects with offline support
  const fetchProjects = useCallback(async (interviewerId: string | null) => {
    if (!interviewerId) {
      setAvailableProjects([]);
      return;
    }
    
    try {
      console.log("Fetching projects for interviewer ID:", interviewerId);
      
      // If offline, try to get cached projects
      if (!isOnline()) {
        const cachedProjects = await getCachedProjects();
        if (cachedProjects.length > 0) {
          console.log("Using cached projects:", cachedProjects);
          setAvailableProjects(cachedProjects as any);
          
          // If only one project, auto-select it
          if (cachedProjects.length === 1) {
            setSelectedProjectId(cachedProjects[0].id);
          } else if (cachedProjects.length > 1 && !isRunning) {
            setSelectedProjectId(null);
          }
          
          return;
        }
      }
      
      // If online, get from Supabase
      if (isOnline()) {
        // Get assigned projects
        const { data: projectAssignments, error: projectsError } = await supabase
          .from('project_interviewers')
          .select('project_id, projects:project_id(*)')
          .eq('interviewer_id', interviewerId);
          
        if (projectsError) {
          throw projectsError;
        }
        
        if (projectAssignments && projectAssignments.length > 0) {
          const projects = projectAssignments.map(pa => pa.projects as Project);
          console.log("Found projects:", projects);
          
          // Cache projects for offline use
          await cacheProjects(projects);
          
          setAvailableProjects(projects);
          
          // If only one project, auto-select it
          if (projects.length === 1) {
            console.log("Single project found, setting project ID:", projects[0].id);
            setSelectedProjectId(projects[0].id);
          } else if (projects.length > 1 && !isRunning) {
            // Reset selected project for multiple projects
            setSelectedProjectId(null);
          }
        } else {
          console.log("No projects found for this interviewer");
          setAvailableProjects([]);
          setSelectedProjectId(null);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setAvailableProjects([]);
    }
  }, [isRunning]);
  
  // Fetch projects when interviewer ID changes
  useEffect(() => {
    fetchProjects(interviewerId);
  }, [interviewerId, fetchProjects]);

  // Fetch active project details when selected project changes
  useEffect(() => {
    const fetchActiveProject = async () => {
      if (!selectedProjectId) {
        setActiveProject(null);
        return;
      }
      
      // For offline mode, check cached projects
      if (!isOnline()) {
        const cachedProjects = await getCachedProjects();
        const project = cachedProjects.find(p => p.id === selectedProjectId);
        
        if (project) {
          // Convert the OfflineProject to a full Project type by adding the missing required fields
          setActiveProject({
            id: project.id,
            name: project.name,
            excluded_islands: project.excluded_islands || [],
            // Add required fields for Project type that might not exist in OfflineProject
            start_date: project.start_date || new Date().toISOString().split('T')[0],
            end_date: project.end_date || new Date().toISOString().split('T')[0]
          });
          return;
        }
      }
      
      // If online, fetch from Supabase
      if (isOnline()) {
        try {
          const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', selectedProjectId)
            .single();
            
          if (error) {
            throw error;
          }
          
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
          setActiveProject(null);
        }
      }
    };
    
    fetchActiveProject();
  }, [selectedProjectId]);

  // Add state for offline status and unsync count
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [unsyncedInterviews, setUnsyncedInterviews] = useState(0);

  // Update online status and check for unsyced sessions
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOffline(!isOnline());
    };
    
    const checkUnsyncedItems = async () => {
      const sessionCount = await getUnsyncedSessionsCount();
      const interviewCount = await getUnsyncedInterviewsCount();
      setUnsyncedCount(sessionCount);
      setUnsyncedInterviews(interviewCount);
    };
    
    // Check initial state
    checkOnlineStatus();
    checkUnsyncedItems();
    
    // Setup listeners for online/offline events
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    
    // Setup interval to check unsync count
    const intervalId = setInterval(checkUnsyncedItems, 30000); // every 30 seconds
    
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
      clearInterval(intervalId);
    };
  }, []);

  // Attempt to sync when back online
  useEffect(() => {
    const handleSync = async () => {
      if (!isOffline && (unsyncedCount > 0 || unsyncedInterviews > 0)) {
        await syncOfflineSessions();
        // Update count after sync attempt
        const newSessionCount = await getUnsyncedSessionsCount();
        const newInterviewCount = await getUnsyncedInterviewsCount();
        setUnsyncedCount(newSessionCount);
        setUnsyncedInterviews(newInterviewCount);
      }
    };
    
    if (!isOffline) {
      handleSync();
    }
  }, [isOffline, unsyncedCount, unsyncedInterviews]);

  // New function to handle login
  const handleLogin = async () => {
    console.log("Login button clicked");
    if (!validateInterviewerCode) {
      console.error("validateInterviewerCode function is not provided");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Validating interviewer code...");
      const isValid = await validateInterviewerCode();
      console.log("Validation result:", isValid);
      
      if (isValid) {
        // Code is valid, fetch projects
        console.log("Fetching projects for interviewer ID:", interviewerId);
        await fetchProjects(interviewerId);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

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
      // Start session flow
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
        
        // Check if interviewer has assigned projects
        if (availableProjects.length === 0) {
          toast({
            title: "Error",
            description: "You are not assigned to any projects",
            variant: "destructive",
          });
          return;
        }
        
        // For single project, use it automatically
        if (availableProjects.length === 1) {
          console.log("Using the only available project:", availableProjects[0].id);
          await handleSessionStart(availableProjects[0].id);
          return;
        }
        
        // For multiple projects, show the selection dialog
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
      // End session flow
      await handleSessionEnd();
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    console.log("Project selected in dialog:", projectId);
    setSelectedProjectId(projectId);
    setShowProjectDialog(false);
    
    // Start session with the selected project
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
      
      const currentLocation = await getCurrentLocation();

      let session: Session | null = null;
      
      // If we're offline or if startSession is provided (for offline support)
      if (!isOnline() && startSession) {
        session = await startSession(interviewerId, projectId, currentLocation);
        if (session) {
          setActiveSession(session);
          setIsRunning(true);
          setStartTime(session.start_time);
          setStartLocation(currentLocation);
          
          toast({
            title: "Offline Session Started",
            description: `Started at ${new Date().toLocaleTimeString()}`,
          });
          return;
        }
      }
      
      // Otherwise proceed with online session
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
        setLoading(false);
        return;
      }
      
      if (!activeSession && offlineSessionId === null) {
        setLoading(false);
        return;
      }
      
      // Get current location
      const currentLocation = await getCurrentLocation();
      
      // If online with an active session
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
      
      // Call the endSession function which handles offline sessions
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

  const handleInterviewAction = async () => {
    if (activeInterview) {
      await stopInterview();
    } else {
      await startInterview(selectedProjectId || undefined);
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
        onLogin={handleLogin} // Make sure this is passed correctly
      />
      
      {isOffline && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            You are currently offline. Sessions and interviews will be saved locally and synchronized when you're back online.
          </p>
        </div>
      )}
      
      {!isOffline && (unsyncedCount > 0 || unsyncedInterviews > 0) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
          <p className="flex items-center justify-between">
            <span>
              {unsyncedCount > 0 && `${unsyncedCount} offline ${unsyncedCount === 1 ? 'session' : 'sessions'}`}
              {unsyncedCount > 0 && unsyncedInterviews > 0 && ' and '}
              {unsyncedInterviews > 0 && `${unsyncedInterviews} ${unsyncedInterviews === 1 ? 'interview' : 'interviews'}`}
              {' waiting to be synchronized'}
            </span>
            <button 
              onClick={() => syncOfflineSessions()}
              className="ml-2 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs"
            >
              Sync Now
            </button>
          </p>
        </div>
      )}
      
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
          isOffline={isOffline}
          unsyncedCount={unsyncedCount + unsyncedInterviews}
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
    </div>
  );
};

export default SessionForm;
