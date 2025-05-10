
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Project, Interviewer } from "@/types";
import { Loader, Plus, Trash } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";

interface ProjectsTabProps {
  interviewer: Interviewer | null;
  assignedProjects: Project[];
  refreshData: () => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ 
  interviewer,
  assignedProjects,
  refreshData
}) => {
  const [loading, setLoading] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { toast } = useToast();
  const { 
    projects, 
    assignInterviewerToProject, 
    removeInterviewerFromProject 
  } = useProjects();

  useEffect(() => {
    if (projects && projects.length > 0) {
      setAllProjects(projects);
    }
  }, [projects]);

  useEffect(() => {
    if (assignedProjects) {
      setSelectedProjects(assignedProjects.map(p => p.id));
    }
  }, [assignedProjects]);

  const handleAssignProject = async (projectId: string) => {
    if (!interviewer) return;
    
    setLoading(true);
    try {
      await assignInterviewerToProject(projectId, interviewer.id);
      refreshData();
      toast({
        title: "Success",
        description: "Project assigned successfully",
      });
    } catch (error) {
      console.error("Error assigning project:", error);
      toast({
        title: "Error",
        description: "Could not assign project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProject = async (projectId: string) => {
    if (!interviewer) return;
    
    setLoading(true);
    try {
      await removeInterviewerFromProject(projectId, interviewer.id);
      refreshData();
      toast({
        title: "Success",
        description: "Project removed successfully",
      });
    } catch (error) {
      console.error("Error removing project:", error);
      toast({
        title: "Error",
        description: "Could not remove project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isProjectAssigned = (projectId: string) => {
    return selectedProjects.includes(projectId);
  };

  // Filter out projects with excluded islands that match the interviewer's island
  const availableProjects = interviewer ? 
    allProjects.filter(project => 
      !project.excluded_islands?.includes(interviewer.island as any)
    ) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Assigned Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assignedProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              This interviewer is not assigned to any projects
            </div>
          ) : (
            <div className="space-y-4">
              {assignedProjects.map((project) => (
                <div key={project.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleRemoveProject(project.id)}
                    disabled={loading}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Available Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : availableProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No available projects found
            </div>
          ) : (
            <div className="space-y-4">
              {availableProjects
                .filter(project => !isProjectAssigned(project.id))
                .map((project) => (
                  <div key={project.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => handleAssignProject(project.id)}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
