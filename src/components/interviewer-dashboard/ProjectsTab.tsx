
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, PlusCircle, Trash2, Calendar, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Interviewer, Project } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface ProjectsTabProps {
  interviewer: Interviewer | null;
  allProjects: Project[];
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ interviewer, allProjects }) => {
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [unassignedProjects, setUnassignedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("assigned");

  // Fetch assigned projects for this interviewer
  useEffect(() => {
    const fetchAssignedProjects = async () => {
      if (!interviewer) return;
      
      setIsLoading(true);
      try {
        // Get all project assignments for this interviewer
        const { data: projectAssignments, error: assignmentError } = await supabase
          .from("project_interviewers")
          .select("project_id")
          .eq("interviewer_id", interviewer.id);
          
        if (assignmentError) {
          throw assignmentError;
        }
        
        // Extract project IDs from assignments
        const assignedProjectIds = projectAssignments?.map(pa => pa.project_id) || [];
        
        // Filter all projects into assigned and unassigned
        const assigned: Project[] = [];
        const unassigned: Project[] = [];
        
        allProjects.forEach(project => {
          if (assignedProjectIds.includes(project.id)) {
            assigned.push(project);
          } else {
            // Check if this project excludes the interviewer's island
            const interviewerIsland = interviewer.island;
            if (!interviewerIsland || !project.excluded_islands || !project.excluded_islands.includes(interviewerIsland)) {
              unassigned.push(project);
            }
          }
        });
        
        setAssignedProjects(assigned);
        setUnassignedProjects(unassigned);
      } catch (error) {
        console.error("Error fetching assigned projects:", error);
        toast.error("Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssignedProjects();
  }, [interviewer, allProjects]);

  // Handle assigning a project to the interviewer
  const assignProject = async (projectId: string) => {
    if (!interviewer) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("project_interviewers")
        .insert({
          interviewer_id: interviewer.id,
          project_id: projectId
        });
        
      if (error) throw error;
      
      // Update local state
      const projectToAssign = unassignedProjects.find(p => p.id === projectId);
      if (projectToAssign) {
        setAssignedProjects([...assignedProjects, projectToAssign]);
        setUnassignedProjects(unassignedProjects.filter(p => p.id !== projectId));
      }
      
      toast.success("Project assigned successfully");
    } catch (error) {
      console.error("Error assigning project:", error);
      toast.error("Failed to assign project");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing a project from the interviewer
  const removeProject = async (projectId: string) => {
    if (!interviewer) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("project_interviewers")
        .delete()
        .eq("interviewer_id", interviewer.id)
        .eq("project_id", projectId);
        
      if (error) throw error;
      
      // Update local state
      const projectToRemove = assignedProjects.find(p => p.id === projectId);
      if (projectToRemove) {
        setUnassignedProjects([...unassignedProjects, projectToRemove]);
        setAssignedProjects(assignedProjects.filter(p => p.id !== projectId));
      }
      
      toast.success("Project removed successfully");
    } catch (error) {
      console.error("Error removing project:", error);
      toast.error("Failed to remove project");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      return `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`;
    } catch (e) {
      return `${startDate} - ${endDate}`;
    }
  };

  return (
    <div className="space-y-6">
      {!interviewer ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading interviewer information...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Projects for {interviewer.first_name} {interviewer.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="assigned">
                    Assigned Projects ({assignedProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="available">
                    Available Projects ({unassignedProjects.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="assigned">
                  {assignedProjects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">
                      No projects assigned to this interviewer yet.
                    </p>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {assignedProjects.map(project => (
                          <div 
                            key={project.id}
                            className="p-3 border rounded-lg flex items-center justify-between hover:bg-accent/5"
                          >
                            <div>
                              <div className="font-medium">{project.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDateRange(project.start_date, project.end_date)}
                                </span>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => removeProject(project.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
                
                <TabsContent value="available">
                  {unassignedProjects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">
                      No more projects available for this interviewer.
                    </p>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {unassignedProjects.map(project => (
                          <div 
                            key={project.id}
                            className="p-3 border rounded-lg flex items-center justify-between hover:bg-accent/5"
                          >
                            <div>
                              <div className="font-medium">{project.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDateRange(project.start_date, project.end_date)}
                                </span>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => assignProject(project.id)}
                              disabled={isLoading}
                            >
                              <PlusCircle className="h-4 w-4 mr-1 text-primary" />
                              Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProjectsTab;
