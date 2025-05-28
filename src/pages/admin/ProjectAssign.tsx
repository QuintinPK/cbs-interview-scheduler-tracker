
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { Interviewer } from "@/types";

const ProjectAssign: React.FC = () => {
  const { interviewers } = useInterviewers();
  const { projects, loading: projectsLoading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [excludedIslands, setExcludedIslands] = useState<('Bonaire' | 'Saba' | 'Sint Eustatius')[]>([]);

  useEffect(() => {
    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject);
      if (project) {
        setExcludedIslands(project.excluded_islands || []);
      }
    }
  }, [selectedProject, projects]);

  const handleAssignProject = async () => {
    if (!selectedProject) return;

    try {
      await supabase
        .from('project_interviewers')
        .insert(
          interviewers
            .filter(interviewer => {
              const interviewerIsland = interviewer.island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined;
              return !interviewerIsland || !excludedIslands.includes(interviewerIsland);
            })
            .map(interviewer => ({
              project_id: selectedProject,
              interviewer_id: interviewer.id,
            }))
        );
      alert("Project assigned successfully!");
    } catch (error) {
      console.error("Error assigning project:", error);
      alert("Failed to assign project.");
    }
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Assign Project to Interviewers</CardTitle>
        </CardHeader>
        <CardContent>
          <select onChange={e => setSelectedProject(e.target.value)} value={selectedProject || ""}>
            <option value="" disabled>Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <Button onClick={handleAssignProject} disabled={!selectedProject}>Assign</Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default ProjectAssign;
