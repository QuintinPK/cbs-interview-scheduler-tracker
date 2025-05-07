
import React, { useState, useEffect, useCallback } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Interviewer, Project } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import { useEvaluations } from "@/hooks/useEvaluations";
import InterviewerRating from "./InterviewerRating";
import InterviewerActions from "./InterviewerActions";
import InterviewerProjects from "./InterviewerProjects";
import ProjectManagementDialog from "./ProjectManagementDialog";
import IslandBadge from "./IslandBadge";
import EvaluationDialog from "./EvaluationDialog";

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
  const { getAllAverageRatings } = useEvaluations();
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [averageRatings, setAverageRatings] = useState<Record<string, number>>({});
  const [ratingsLoading, setRatingsLoading] = useState(true);

  // Load ratings once when component mounts and not on every re-render
  const loadRatings = useCallback(async () => {
    setRatingsLoading(true);
    try {
      const ratings = await getAllAverageRatings();
      setAverageRatings(ratings);
    } catch (error) {
      console.error("Error loading ratings:", error);
    } finally {
      setRatingsLoading(false);
    }
  }, [getAllAverageRatings]);

  useEffect(() => {
    loadRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRatings]);

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
                      <IslandBadge island={interviewer.island} />
                    </TableCell>
                    <TableCell>
                      <InterviewerRating 
                        rating={averageRatings[interviewer.id]} 
                        ratingsLoading={ratingsLoading} 
                        interviewerId={interviewer.id} 
                      />
                    </TableCell>
                    <TableCell>
                      <InterviewerProjects 
                        projects={interviewerProjects[interviewer.id] || []} 
                        onManageProjects={() => handleManageProjects(interviewer)} 
                      />
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
                      <InterviewerActions 
                        interviewer={interviewer}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSchedule={onSchedule}
                        onViewDashboard={onViewDashboard}
                        onEvaluate={handleEvaluate}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedInterviewer && (
        <>
          <ProjectManagementDialog
            open={showProjectDialog}
            onOpenChange={setShowProjectDialog}
            selectedInterviewer={selectedInterviewer}
            availableProjects={getAvailableProjects(selectedInterviewer)}
            assignedProjects={assignedProjects}
            isLoading={projectsLoading || assignmentsLoading}
            onToggleProject={handleProjectToggle}
          />

          <EvaluationDialog
            interviewer={selectedInterviewer}
            open={showEvaluationDialog}
            onOpenChange={setShowEvaluationDialog}
            projects={interviewerProjects[selectedInterviewer.id] || []}
          />
        </>
      )}
    </>
  );
};

export default InterviewerList;
