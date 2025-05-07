
import React from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Interviewer, Project } from "@/types";

interface ProjectManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInterviewer: Interviewer | null;
  availableProjects: Project[];
  assignedProjects: Project[];
  isLoading: boolean;
  onToggleProject: (project: Project, checked: boolean) => void;
}

const ProjectManagementDialog: React.FC<ProjectManagementDialogProps> = ({
  open,
  onOpenChange,
  selectedInterviewer,
  availableProjects,
  assignedProjects,
  isLoading,
  onToggleProject,
}) => {
  const isProjectAssigned = (projectId: string) => {
    return assignedProjects.some(p => p.id === projectId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Manage Projects for {selectedInterviewer?.first_name} {selectedInterviewer?.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              availableProjects.map((project) => (
                <div key={project.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={isProjectAssigned(project.id)}
                    onCheckedChange={(checked) => onToggleProject(project, checked as boolean)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={`project-${project.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {project.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectManagementDialog;
