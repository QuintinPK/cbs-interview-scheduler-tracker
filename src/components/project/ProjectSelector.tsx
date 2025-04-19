
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { Project } from "@/types";

interface ProjectSelectorProps {
  selectedProjectId?: string;
  onProjectChange: (projectId: string) => void;
  interviewerId?: string;
  island?: 'Bonaire' | 'Saba' | 'Sint Eustatius';
  disabled?: boolean;
  placeholder?: string;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProjectId,
  onProjectChange,
  interviewerId,
  island,
  disabled = false,
  placeholder = "Select a project"
}) => {
  const { projects, loading, getInterviewerProjects } = useProjects();
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [interviewerProjects, setInterviewerProjects] = useState<Project[]>([]);

  // If interviewerId is provided, only show projects assigned to that interviewer
  useEffect(() => {
    const loadInterviewerProjects = async () => {
      if (interviewerId) {
        const assignedProjects = await getInterviewerProjects(interviewerId);
        setInterviewerProjects(assignedProjects);
      }
    };
    
    loadInterviewerProjects();
  }, [interviewerId, getInterviewerProjects]);

  // Filter projects based on island if provided
  useEffect(() => {
    let filtered = [...projects];
    
    if (island) {
      // Only include projects where the specified island is not excluded
      filtered = filtered.filter(project => !project.excluded_islands.includes(island));
    }
    
    if (interviewerId && interviewerProjects.length > 0) {
      filtered = filtered.filter(project => 
        interviewerProjects.some(ip => ip.id === project.id)
      );
    }
    
    setFilteredProjects(filtered);
  }, [projects, island, interviewerId, interviewerProjects]);

  // Helper function to get a display name that includes active islands
  const getProjectDisplayName = (project: Project) => {
    const allIslands: ('Bonaire' | 'Saba' | 'Sint Eustatius')[] = ['Bonaire', 'Saba', 'Sint Eustatius'];
    const includedIslands = allIslands.filter(island => !project.excluded_islands.includes(island));
    const islandNames = includedIslands.join(', ');
    return `${project.name} (${islandNames})`;
  };

  return (
    <Select
      value={selectedProjectId}
      onValueChange={onProjectChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredProjects.length === 0 ? (
          <SelectItem value="no-projects" disabled>
            {interviewerId 
              ? "No projects assigned to this interviewer" 
              : (island 
                  ? `No projects available for ${island}` 
                  : "No projects available"
                )
            }
          </SelectItem>
        ) : (
          filteredProjects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {getProjectDisplayName(project)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default ProjectSelector;
