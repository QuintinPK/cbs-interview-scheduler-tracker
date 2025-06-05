
import { useState, useEffect, useCallback } from "react";
import { Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { isOnline, getCachedProjects, cacheProjects } from "@/lib/offlineDB";

export const useProjectManagement = (interviewerId: string | null, isRunning: boolean) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async (interviewerId: string | null) => {
    if (!interviewerId) {
      setAvailableProjects([]);
      return;
    }
    
    try {
      console.log("Fetching projects for interviewer ID:", interviewerId);
      
      if (!isOnline()) {
        const cachedProjects = await getCachedProjects();
        if (cachedProjects.length > 0) {
          console.log("Using cached projects:", cachedProjects);
          setAvailableProjects(cachedProjects as any);
          
          if (cachedProjects.length === 1) {
            setSelectedProjectId(cachedProjects[0].id);
          } else if (cachedProjects.length > 1 && !isRunning) {
            setSelectedProjectId(null);
          }
          
          return;
        }
      }
      
      if (isOnline()) {
        const { data: projectAssignments, error: projectsError } = await supabase
          .from('project_interviewers')
          .select('project_id, projects:project_id(*)')
          .eq('interviewer_id', interviewerId);
          
        if (projectsError) {
          throw projectsError;
        }
        
        if (projectAssignments && projectAssignments.length > 0) {
          const projects = projectAssignments.map(pa => pa.projects as Project);
          console.log("Found projects:", projects);
          
          await cacheProjects(projects);
          
          setAvailableProjects(projects);
          
          if (projects.length === 1) {
            console.log("Single project found, setting project ID:", projects[0].id);
            setSelectedProjectId(projects[0].id);
          } else if (projects.length > 1 && !isRunning) {
            setSelectedProjectId(null);
          }
        } else {
          console.log("No projects found for this interviewer");
          setAvailableProjects([]);
          setSelectedProjectId(null);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setAvailableProjects([]);
    }
  }, [isRunning]);

  useEffect(() => {
    fetchProjects(interviewerId);
  }, [interviewerId, fetchProjects]);

  useEffect(() => {
    const fetchActiveProject = async () => {
      if (!selectedProjectId) {
        setActiveProject(null);
        return;
      }
      
      if (!isOnline()) {
        const cachedProjects = await getCachedProjects();
        const project = cachedProjects.find(p => p.id === selectedProjectId);
        
        if (project) {
          setActiveProject({
            id: project.id,
            name: project.name,
            excluded_islands: project.excluded_islands || [],
            start_date: project.start_date || new Date().toISOString().split('T')[0],
            end_date: project.end_date || new Date().toISOString().split('T')[0]
          });
          return;
        }
      }
      
      if (isOnline()) {
        try {
          const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', selectedProjectId)
            .single();
            
          if (error) {
            throw error;
          }
          
          setActiveProject({
            id: project.id,
            name: project.name,
            start_date: project.start_date,
            end_date: project.end_date,
            excluded_islands: (project.excluded_islands || []) as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
          });
        } catch (error) {
          console.error("Error fetching project details:", error);
          setActiveProject(null);
        }
      }
    };
    
    fetchActiveProject();
  }, [selectedProjectId]);

  return {
    selectedProjectId,
    setSelectedProjectId,
    availableProjects,
    showProjectDialog,
    setShowProjectDialog,
    activeProject,
    fetchProjects
  };
};
