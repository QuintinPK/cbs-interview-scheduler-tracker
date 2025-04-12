
import React, { useState, useEffect } from "react";
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
import { Pencil, Trash2, Users, Loader2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onAssign: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading,
  onEdit,
  onDelete,
  onAssign
}) => {
  const [interviewerCounts, setInterviewerCounts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchInterviewerCounts = async () => {
      const projectIds = projects.map(project => project.id);
      if (projectIds.length === 0) return;
      
      try {
        // Corrected query syntax for counting interviewers per project
        const { data, error } = await supabase
          .from('project_interviewers')
          .select('project_id, count', { count: 'exact' })
          .in('project_id', projectIds);
        
        if (error) throw error;
        
        // Count interviewers per project manually
        const counts: Record<string, number> = {};
        projectIds.forEach(id => {
          counts[id] = data?.filter(item => item.project_id === id).length || 0;
        });
        
        setInterviewerCounts(counts);
      } catch (error) {
        console.error("Error fetching interviewer counts:", error);
      }
    };
    
    fetchInterviewerCounts();
  }, [projects]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Island</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Interviewers</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cbs" />
                  </div>
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      project.island === 'Bonaire' ? 'default' : 
                      project.island === 'Saba' ? 'info' : 
                      'purple'
                    }>
                      {project.island}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(project.start_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(project.end_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{interviewerCounts[project.id] || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(project)}
                        title="Edit Project"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAssign(project)}
                        title="Assign Interviewers"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(project)}
                        title="Delete Project"
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
  );
};

export default ProjectList;
