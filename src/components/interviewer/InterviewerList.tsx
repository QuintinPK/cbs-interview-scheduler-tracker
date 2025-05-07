import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar, BarChart, Loader2, Users, Star } from "lucide-react";
import { Interviewer, Project } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "@/components/ui/star-rating";
import { useEvaluationStats } from "@/hooks/evaluation/useEvaluationStats";
import EvaluationDialog from "./EvaluationDialog";
import { useNavigate } from "react-router-dom";

interface InterviewerListProps {
  interviewers: Interviewer[];
  loading: boolean;
  onEdit: (interviewer: Interviewer) => void;
  onDelete: (interviewer: Interviewer) => void;
  onSchedule: (interviewer: Interviewer) => void;
  onViewDashboard: (interviewer: Interviewer) => void;
  interviewerProjects: {[key: string]: Project[]};
}

const InterviewerList: React.FC<InterviewerListProps> = ({
  interviewers,
  loading,
  onEdit,
  onDelete,
  onSchedule,
  onViewDashboard,
  interviewerProjects,
}) => {
  const { toast } = useToast();
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const { projects, loading: projectsLoading, getInterviewerProjects, assignInterviewerToProject, removeInterviewerFromProject } = useProjects();
  const { getAllAverageRatings } = useEvaluationStats();
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [averageRatings, setAverageRatings] = useState<Record<string, number>>({});
  const [ratingsLoading, setRatingsLoading] = useState(true);

  // Load ratings once when component mounts
  useEffect(() => {
    const loadRatings = async () => {
      setRatingsLoading(true);
      try {
        const ratings = await getAllAverageRatings();
        console.log("Loaded ratings:", ratings);
        setAverageRatings(ratings);
      } catch (error) {
        console.error("Error loading ratings:", error);
      } finally {
        setRatingsLoading(false);
      }
    };

    loadRatings();
  }, [getAllAverageRatings]);

  const getIslandBadgeStyle = (island: string | undefined) => {
    switch (island) {
      case 'Bonaire':
        return { variant: "success" as const };
      case 'Saba':
        return { variant: "warning" as const };
      case 'Sint Eustatius':
        return { variant: "danger" as const };
      default:
        return { variant: "outline" as const };
    }
  };

  const handleManageProjects = async (interviewer: Interviewer) => {
    setSelectedInterviewer(interviewer);
    setShowProjectDialog(true);
    setAssignmentsLoading(true);
    
    try {
      const projects = await getInterviewerProjects(interviewer.id);
      setAssignedProjects(projects);
    } catch (error) {
      console.error("Error fetching interviewer projects:", error);
      toast({
        title: "Error",
        description: "Could not load interviewer's projects",
        variant: "destructive",
      });
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleProjectToggle = async (project: Project, checked: boolean) => {
    if (!selectedInterviewer) return;
    
    setAssignmentsLoading(true);
    try {
      if (checked) {
        await assignInterviewerToProject(project.id, selectedInterviewer.id);
        setAssignedProjects(prev => [...prev, project]);
      } else {
        await removeInterviewerFromProject(project.id, selectedInterviewer.id);
        setAssignedProjects(prev => prev.filter(p => p.id !== project.id));
      }
    } catch (error) {
      console.error("Error updating project assignment:", error);
      toast({
        title: "Error",
        description: "Could not update project assignment",
        variant: "destructive",
      });
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const isProjectAssigned = (projectId: string) => {
    return assignedProjects.some(p => p.id === projectId);
  };

  const getAvailableProjects = (interviewer: Interviewer) => {
    if (!interviewer.island) return projects;
    return projects.filter(project => 
      !project.excluded_islands?.includes(interviewer.island as 'Bonaire' | 'Saba' | 'Sint Eustatius')
    );
  };

  const handleEvaluate = (interviewer: Interviewer) => {
    setSelectedInterviewer(interviewer);
    setShowEvaluationDialog(true);
  };

  // Create a stable rating component to prevent unnecessary re-renders
  const RatingDisplay = useCallback(({ interviewerId }: { interviewerId: string }) => {
    const rating = averageRatings[interviewerId];
    
    if (ratingsLoading) {
      return (
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-xs text-muted-foreground">Loading</span>
        </div>
      );
    }
    
    if (rating) {
      return <StarRating rating={rating} readOnly size={16} />;
    }
    
    return <span className="text-muted-foreground text-sm">Not rated</span>;
  }, [averageRatings, ratingsLoading]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Island</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-cbs" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : interviewers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No interviewers found
                  </TableCell>
                </TableRow>
              ) : (
                interviewers.map((interviewer) => (
                  <TableRow key={interviewer.id}>
                    <TableCell className="font-medium">{interviewer.code}</TableCell>
                    <TableCell>{interviewer.first_name} {interviewer.last_name}</TableCell>
                    <TableCell>
                      {interviewer.island ? (
                        <Badge 
                          {...getIslandBadgeStyle(interviewer.island)}
                        >
                          {interviewer.island}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RatingDisplay interviewerId={interviewer.id} />
                    </TableCell>
                    <TableCell>
                      {interviewerProjects[interviewer.id] && interviewerProjects[interviewer.id].length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {interviewerProjects[interviewer.id].map(project => (
                            <Badge key={project.id} variant="outline" className="mb-1">
                              {project.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No projects</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageProjects(interviewer)}
                        className="text-xs"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Manage Projects
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {interviewer.phone && (
                          <div className="text-sm">{interviewer.phone}</div>
                        )}
                        {interviewer.email && (
                          <div className="text-sm text-muted-foreground">{interviewer.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(interviewer)}
                          title="Edit Interviewer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEvaluate(interviewer)}
                          title="Evaluate Interviewer"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onSchedule(interviewer)}
                          title="Schedule Interviewer"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDashboard(interviewer)}
                          title="View Dashboard"
                        >
                          <BarChart className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(interviewer)}
                          title="Delete Interviewer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Manage Projects for {selectedInterviewer?.first_name} {selectedInterviewer?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-4">
              {projectsLoading || assignmentsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                selectedInterviewer && getAvailableProjects(selectedInterviewer).map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={isProjectAssigned(project.id)}
                      onCheckedChange={(checked) => handleProjectToggle(project, checked as boolean)}
                      disabled={assignmentsLoading}
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

      <EvaluationDialog
        interviewer={selectedInterviewer}
        open={showEvaluationDialog}
        onOpenChange={setShowEvaluationDialog}
        projects={selectedInterviewer ? 
          (interviewerProjects[selectedInterviewer.id] || []) : 
          []
        }
      />
    </>
  );
};

export default InterviewerList;
