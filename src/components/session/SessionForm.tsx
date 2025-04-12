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
import { useProjects } from "@/hooks/useProjects";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
  const [interviewerId, setInterviewerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  
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

  useEffect(() => {
    const fetchInterviewerId = async () => {
      if (!interviewerCode.trim()) return;
      
      try {
        const { data, error } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setInterviewerId(data[0].id);
        } else {
          setInterviewerId(null);
        }
      } catch (error) {
        console.error("Error fetching interviewer ID:", error);
      }
    };
    
    fetchInterviewerId();
  }, [interviewerCode]);
  
  useEffect(() => {
    const fetchInterviewerProjects = async () => {
      if (!interviewerId) {
        setAvailableProjects([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('project_interviewers')
          .select(`
            projects:project_id(*)
          `)
          .eq('interviewer_id', interviewerId);
          
        if (error) throw error;
        
        const projects = data.map(item => item.projects) as Project[];
        setAvailableProjects(projects);
        
        if (activeSession?.project_id) {
          setSelectedProjectId(activeSession.project_id);
        } 
        else if (projects.length === 1 && !selectedProjectId) {
          setSelectedProjectId(projects[0].id);
        }
      } catch (error) {
        console.error("Error fetching interviewer projects:", error);
      }
    };
    
    fetchInterviewerProjects();
  }, [interviewerId, activeSession]);

  const handleStartStop = async () => {
    if (!interviewerCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter your interviewer code",
        variant: "destructive",
      });
      return;
    }
    
    if (!isRunning && !selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project before starting your session",
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
      await startInterview(activeSession?.project_id || null);
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
      
      {!isRunning && interviewerId && (
        <div className="space-y-2">
          <Label htmlFor="project-select">Select Project</Label>
          <Select
            value={selectedProjectId || ""}
            onValueChange={(value) => setSelectedProjectId(value)}
            disabled={isRunning || loading || availableProjects.length === 0}
          >
            <SelectTrigger id="project-select">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {availableProjects.length === 0 ? (
                <SelectItem value="_no_projects" disabled>
                  No projects assigned
                </SelectItem>
              ) : (
                availableProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.island})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {availableProjects.length === 0 && interviewerId && (
            <p className="text-xs text-amber-600">You are not assigned to any projects. Please contact your administrator.</p>
          )}
        </div>
      )}
      
      <CurrentSessionTime startTime={startTime} isRunning={isRunning} />
      
      <ActiveSessionInfo
        isRunning={isRunning}
        startTime={startTime}
        startLocation={startLocation}
        projectName={
          isRunning && activeSession?.project_id
            ? availableProjects.find(p => p.id === activeSession.project_id)?.name || ""
            : ""
        }
        island={
          isRunning && activeSession?.project_id
            ? availableProjects.find(p => p.id === activeSession.project_id)?.island || null
            : null
        }
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
          disabled={(isRunning && !!activeInterview) || (!isRunning && (!selectedProjectId || availableProjects.length === 0))}
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
