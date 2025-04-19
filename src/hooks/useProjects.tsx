
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Project, Interviewer } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useProjects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadProjects = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      // Transform the data to ensure excluded_islands is properly typed
      const typedProjects: Project[] = (data || []).map(project => ({
        id: project.id,
        name: project.name,
        start_date: project.start_date,
        end_date: project.end_date,
        excluded_islands: (project.excluded_islands || []) as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
      }));
      
      setProjects(typedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Error",
        description: "Could not load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Optimized method to get all assignments at once
  const getAllProjectAssignments = useCallback(async () => {
    try {
      // Get all project_interviewers records in a single query
      const { data: assignments, error } = await supabase
        .from('project_interviewers')
        .select('project_id, interviewer_id');
        
      if (error) throw error;
      
      // If no assignments, return empty object
      if (!assignments || assignments.length === 0) {
        return {};
      }
      
      // Create map of interviewer IDs to their project IDs
      const interviewerProjectsMap: Record<string, string[]> = {};
      
      // Populate the map
      assignments.forEach(assignment => {
        const { interviewer_id, project_id } = assignment;
        
        if (!interviewerProjectsMap[interviewer_id]) {
          interviewerProjectsMap[interviewer_id] = [];
        }
        
        interviewerProjectsMap[interviewer_id].push(project_id);
      });
      
      // Get all projects in one query
      const { data: allProjects, error: projectsError } = await supabase
        .from('projects')
        .select('*');
        
      if (projectsError) throw projectsError;
      
      // Create a map of project IDs to project objects for easy lookup
      const projectsMap: Record<string, Project> = {};
      
      allProjects?.forEach(project => {
        projectsMap[project.id] = {
          id: project.id,
          name: project.name,
          start_date: project.start_date,
          end_date: project.end_date,
          excluded_islands: (project.excluded_islands || []) as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
        };
      });
      
      // Create the final result with full project details
      const result: Record<string, Project[]> = {};
      
      Object.entries(interviewerProjectsMap).forEach(([interviewerId, projectIds]) => {
        result[interviewerId] = projectIds
          .map(id => projectsMap[id])
          .filter(Boolean); // Remove any undefined entries
      });
      
      return result;
    } catch (error) {
      console.error("Error getting all project assignments:", error);
      toast({
        title: "Error",
        description: "Could not load project assignments",
        variant: "destructive",
      });
      return {};
    }
  }, [toast]);

  // Get projects for a specific interviewer
  const getInterviewerProjects = async (interviewerId: string): Promise<Project[]> => {
    try {
      // Get project IDs for this interviewer
      const { data, error } = await supabase
        .from('project_interviewers')
        .select('project_id')
        .eq('interviewer_id', interviewerId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      const projectIds = data.map(pi => pi.project_id);
      
      // Get full project details
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds);
        
      if (projectsError) throw projectsError;
      
      return (projectsData || []).map(project => ({
        id: project.id,
        name: project.name,
        start_date: project.start_date,
        end_date: project.end_date,
        excluded_islands: (project.excluded_islands || []) as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
      }));
    } catch (error) {
      console.error("Error getting interviewer projects:", error);
      toast({
        title: "Error",
        description: "Could not load interviewer projects",
        variant: "destructive",
      });
      return [];
    }
  };

  // Project assignment operations
  const assignInterviewerToProject = async (projectId: string, interviewerId: string) => {
    try {
      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      // Get interviewer details
      const { data: interviewer, error: interviewerError } = await supabase
        .from('interviewers')
        .select('*')
        .eq('id', interviewerId)
        .single();
        
      if (interviewerError) throw interviewerError;
      
      // Check island exclusion
      if (interviewer.island && project.excluded_islands?.includes(interviewer.island)) {
        toast({
          title: "Error",
          description: `Interviewers from ${interviewer.island} are excluded from this project`,
          variant: "destructive",
        });
        throw new Error("Island excluded from project");
      }
      
      // Create assignment
      const { error } = await supabase
        .from('project_interviewers')
        .insert([{ project_id: projectId, interviewer_id: interviewerId }]);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Interviewer assigned to project successfully",
      });
    } catch (error) {
      console.error("Error assigning interviewer to project:", error);
      if (!(error instanceof Error) || error.message !== "Island excluded from project") {
        toast({
          title: "Error",
          description: "Could not assign interviewer to project",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const removeInterviewerFromProject = async (projectId: string, interviewerId: string) => {
    try {
      const { error } = await supabase
        .from('project_interviewers')
        .delete()
        .eq('project_id', projectId)
        .eq('interviewer_id', interviewerId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Interviewer removed from project successfully",
      });
    } catch (error) {
      console.error("Error removing interviewer from project:", error);
      toast({
        title: "Error",
        description: "Could not remove interviewer from project",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getProjectInterviewers = async (projectId: string): Promise<Interviewer[]> => {
    try {
      const { data, error } = await supabase
        .from('project_interviewers')
        .select('interviewer_id')
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      const interviewerIds = data.map(pi => pi.interviewer_id);
      
      const { data: interviewers, error: interviewersError } = await supabase
        .from('interviewers')
        .select('*')
        .in('id', interviewerIds);
        
      if (interviewersError) throw interviewersError;
      
      return (interviewers || []).map(interviewer => ({
        id: interviewer.id,
        code: interviewer.code,
        first_name: interviewer.first_name,
        last_name: interviewer.last_name,
        phone: interviewer.phone || "",
        email: interviewer.email || "",
        island: interviewer.island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined
      }));
    } catch (error) {
      console.error("Error getting project interviewers:", error);
      toast({
        title: "Error",
        description: "Could not load project interviewers",
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    projects,
    loading,
    addProject: async (project: Omit<Project, 'id'>) => {
      try {
        setLoading(true);
        
        const dbProject = {
          name: project.name,
          start_date: project.start_date,
          end_date: project.end_date,
          excluded_islands: project.excluded_islands,
          island: 'Bonaire' as 'Bonaire' | 'Saba' | 'Sint Eustatius'
        };
        
        const { data, error } = await supabase
          .from('projects')
          .insert([dbProject])
          .select()
          .single();
          
        if (error) throw error;
        
        const typedProject: Project = {
          id: data.id,
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
          excluded_islands: (data.excluded_islands || []) as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
        };
        
        toast({
          title: "Success",
          description: "New project added successfully",
        });
        
        setProjects([...projects, typedProject]);
        return typedProject;
      } catch (error) {
        console.error("Error adding project:", error);
        toast({
          title: "Error",
          description: "Could not add project",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    updateProject: async (id: string, project: Omit<Project, 'id'>) => {
      try {
        setLoading(true);
        
        const dbProject = {
          name: project.name,
          start_date: project.start_date,
          end_date: project.end_date,
          excluded_islands: project.excluded_islands,
          island: 'Bonaire' as 'Bonaire' | 'Saba' | 'Sint Eustatius'
        };
        
        const { error } = await supabase
          .from('projects')
          .update(dbProject)
          .eq('id', id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
        
        setProjects(projects.map(p => p.id === id ? { ...p, ...project } : p));
      } catch (error) {
        console.error("Error updating project:", error);
        toast({
          title: "Error",
          description: "Could not update project",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    deleteProject: async (id: string) => {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        setProjects(projects.filter(p => p.id !== id));
        
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting project:", error);
        toast({
          title: "Error",
          description: "Could not delete project",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    assignInterviewerToProject,
    removeInterviewerFromProject,
    getProjectInterviewers,
    getInterviewerProjects,
    getAllProjectAssignments,
    refresh: loadProjects
  };
};
