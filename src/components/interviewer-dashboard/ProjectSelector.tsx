
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectSelectorProps {
  selectedProject: string;
  setSelectedProject: (value: string) => void;
  projectIds: string[];
  projectMap: Map<string, string>;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProject,
  setSelectedProject,
  projectIds,
  projectMap
}) => {
  return (
    <div className="w-64">
      <Select 
        value={selectedProject}
        onValueChange={setSelectedProject}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filter by Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projectIds.map(id => (
            <SelectItem key={id} value={id}>{projectMap.get(id) || id}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
