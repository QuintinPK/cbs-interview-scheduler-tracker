
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            You are assigned to multiple projects. Please select which project you want to work on:
          </p>
          <div className="space-y-2">
            {projects.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                className="w-full justify-start text-left"
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
