import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Project } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Circle } from "lucide-react";

interface SessionFormProps {
  interviewerCode: string;
  setInterviewerCode: (code: string) => void;
  activeSession: any;
  isStartingSession: boolean;
  isStoppingSession: boolean;
  startSession: (projectId?: string) => Promise<void>;
  stopSession: () => Promise<void>;
}

const SessionForm: React.FC<SessionFormProps> = ({
  interviewerCode,
  setInterviewerCode,
  activeSession,
  isStartingSession,
  isStoppingSession,
  startSession,
  stopSession
}) => {
  const { toast } = useToast();
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { projects, loading } = useProjects();

  useEffect(() => {
    if (!interviewerCode && localStorage.getItem('interviewerCode')) {
      setInterviewerCode(localStorage.getItem('interviewerCode') || '');
    }
  }, [setInterviewerCode, interviewerCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setInterviewerCode(code);
    localStorage.setItem('interviewerCode', code);
  };

  const handleStartSession = async () => {
    if (!selectedProject) {
      toast({
        title: "Select Project",
        description: "Please select a project before starting a session.",
        variant: "destructive",
      });
      return;
    }

    await startSession(selectedProject.id);
    setShowProjectDialog(false);
  };

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <Label htmlFor="interviewer-code">Interviewer Code</Label>
        <Input
          id="interviewer-code"
          placeholder="Enter your code"
          value={interviewerCode}
          onChange={handleCodeChange}
          disabled={activeSession != null}
        />
      </div>

      {!activeSession && interviewerCode ? (
        <Button
          className="w-full"
          onClick={() => setShowProjectDialog(true)}
          disabled={isStartingSession || loading}
        >
          {isStartingSession ? "Starting Session..." : "Start Session"}
        </Button>
      ) : activeSession && interviewerCode ? (
        <Button
          variant="destructive"
          className="w-full"
          onClick={stopSession}
          disabled={isStoppingSession}
        >
          {isStoppingSession ? "Stopping Session..." : "Stop Session"}
        </Button>
      ) : null}

      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Project</DialogTitle>
            <DialogDescription>
              Choose the project you will be working on during this session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loading ? (
              <p>Loading projects...</p>
            ) : projects.length === 0 ? (
              <p>No projects available.</p>
            ) : (
              <RadioGroup
                defaultValue={selectedProject?.id}
                onValueChange={(value) => {
                  const project = projects.find((p) => p.id === value);
                  setSelectedProject(project || null);
                }}
              >
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={project.id} id={project.id} />
                    <Label htmlFor={project.id} className="flex items-center">
                      <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                      {project.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleStartSession} disabled={!selectedProject}>
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionForm;
