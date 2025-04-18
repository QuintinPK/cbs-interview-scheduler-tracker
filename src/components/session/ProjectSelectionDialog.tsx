
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Project } from "@/types";

interface ProjectSelectionDialogProps {
  isOpen: boolean;
  projects: Project[];
  onProjectSelect: (projectId: string) => void;
  onClose: () => void;
}

const ProjectSelectionDialog: React.FC<ProjectSelectionDialogProps> = ({
  isOpen,
  projects,
  onProjectSelect,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Project</DialogTitle>
          <DialogDescription>
            You are assigned to multiple projects. Please select which project you want to work on:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            {projects.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                className="w-full justify-start text-left font-medium"
                onClick={() => onProjectSelect(project.id)}
              >
                {project.name}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSelectionDialog;
