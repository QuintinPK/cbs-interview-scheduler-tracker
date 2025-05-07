
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Project } from "@/types";

interface InterviewerProjectsProps {
  projects: Project[];
  onManageProjects: () => void;
}

const InterviewerProjects: React.FC<InterviewerProjectsProps> = ({
  projects,
  onManageProjects,
}) => {
  return (
    <>
      <div>
        {projects && projects.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {projects.map(project => (
              <Badge key={project.id} variant="outline" className="mb-1">
                {project.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">No projects</span>
        )}
      </div>
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={onManageProjects}
          className="text-xs"
        >
          <Users className="h-3 w-3 mr-1" />
          Manage Projects
        </Button>
      </div>
    </>
  );
};

export default InterviewerProjects;
