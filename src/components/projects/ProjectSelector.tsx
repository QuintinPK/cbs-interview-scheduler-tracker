
import { useState, useEffect } from "react";
import { Project, Island } from "@/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
  loading?: boolean;
  label?: string;
  placeholder?: string;
}

const ProjectSelector = ({
  projects,
  selectedProjectId,
  onProjectChange,
  loading = false,
  label = "Project",
  placeholder = "Select a project"
}: ProjectSelectorProps) => {
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select
        value={selectedProjectId || ""}
        onValueChange={(value) => onProjectChange(value === "_all" ? null : value)}
        disabled={loading || projects.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {projects.length === 0 ? (
            <SelectItem value="_none" disabled>
              No projects available
            </SelectItem>
          ) : (
            <>
              <SelectItem value="_all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectSelector;
