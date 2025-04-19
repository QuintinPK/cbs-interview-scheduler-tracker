import { useState, useEffect } from "react";
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

  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      setLoading(true);
      
      // Prepare the project data for database insertion
      const dbProject = {
        name: project.name,
        start_date: project.start_date,
        end_date: project.end_date,
        excluded_islands: project.excluded_islands,
        // Include the required island field for the database schema
        island: 'Bonaire' as 'Bonaire' | 'Saba' | 'Sint Eustatius' // Explicitly typed to match the enum
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
  };

  const updateProject = async (id: string, project: Omit<Project, 'id'>) => {
    try {
      setLoading(true);
      
      // Prepare the project data for database update
      const dbProject = {
        name: project.name,
        start_date: project.start_date,
        end_date: project.end_date,
        excluded_islands: project.excluded_islands,
        // Include the required island field for the database schema
        island: 'Bonaire' as 'Bonaire' | 'Saba' | 'Sint Eustatius' // Explicitly typed to match the enum
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
  };

  const deleteProject = async (id: string) => {
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
  };

  const assignInterviewerToProject = async (projectId: string, interviewerId: string) => {
    try {
      // First, get the project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      // Then, get the interviewer details
      const { data: interviewer, error: interviewerError } = await supabase
        .from('interviewers')
        .select('*')
        .eq('id', interviewerId)
        .single();
        
      if (interviewerError) throw interviewerError;
      
      // Check if the interviewer's island is excluded from the project
      if (interviewer.island && project.excluded_islands?.includes(interviewer.island)) {
        toast({
          title: "Error",
          description: `Interviewers from ${interviewer.island} are excluded from this project`,
          variant: "destructive",
        });
        throw new Error("Island excluded from project");
      }
      
      // If islands match or interviewer has no island, proceed with assignment
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
      setLoading(true);
      
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
    } finally {
      setLoading(false);
    }
  };

  const getProjectInterviewers = async (projectId: string): Promise<Interviewer[]> => {
    try {
      setLoading(true);
      
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
      
      const typedInterviewers: Interviewer[] = interviewers?.map(interviewer => ({
        id: interviewer.id,
        code: interviewer.code,
        first_name: interviewer.first_name,
        last_name: interviewer.last_name,
        phone: interviewer.phone || "",
        email: interviewer.email || "",
        island: (interviewer.island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined)
      })) || [];
      
      return typedInterviewers;
    } catch (error) {
      console.error("Error getting project interviewers:", error);
      toast({
        title: "Error",
        description: "Could not load project interviewers",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getInterviewerProjects = async (interviewerId: string): Promise<Project[]> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('project_interviewers')
        .select('project_id')
        .eq('interviewer_id', interviewerId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      const projectIds = data.map(pi => pi.project_id);
      
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds);
        
      if (projectsError) throw projectsError;
      
      // Transform the data to ensure excluded_islands is properly typed
      return (projects || []).map(project => ({
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
    } finally {
      setLoading(false);
    }
  };

  // New method to get all project assignments for all interviewers at once
  const getProjectAssignments = async (): Promise<{[key: string]: Project[]}> => {
    try {
      setLoading(true);
      
      // First get all project_interviewers records
      const { data: assignments, error: assignmentsError } = await supabase
        .from('project_interviewers')
        .select('*');
        
      if (assignmentsError) throw assignmentsError;
      
      if (!assignments || assignments.length === 0) return {};
      
      // Get all projects in one query
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
        
      if (projectsError) throw projectsError;
      
      // Create a map of project IDs to project details for fast lookup
      const projectMap: {[key: string]: Project} = {};
      projectsData?.forEach(project => {
        projectMap[project.id] = {
          id: project.id,
          name: project.name,
          start_date: project.start_date,
          end_date: project.end_date,
          excluded_islands: (project.excluded_islands || []) as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
        };
      });
      
      // Group assignments by interviewer
      const result: {[key: string]: Project[]} = {};
      
      assignments.forEach(assignment => {
        const interviewerId = assignment.interviewer_id;
        const projectId = assignment.project_id;
        
        if (!result[interviewerId]) {
          result[interviewerId] = [];
        }
        
        if (projectMap[projectId]) {
          result[interviewerId].push(projectMap[projectId]);
        }
      });
      
      return result;
    } catch (error) {
      console.error("Error getting project assignments:", error);
      toast({
        title: "Error",
        description: "Could not load project assignments",
        variant: "destructive",
      });
      return {};
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    addProject,
    updateProject,
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
    assignInterviewerToProject: async (projectId: string, interviewerId: string) => {
      try {
        // First, get the project details
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
          
        if (projectError) throw projectError;
        
        // Then, get the interviewer details
        const { data: interviewer, error: interviewerError } = await supabase
          .from('interviewers')
          .select('*')
          .eq('id', interviewerId)
          .single();
          
        if (interviewerError) throw interviewerError;
        
        // Check if the interviewer's island is excluded from the project
        if (interviewer.island && project.excluded_islands?.includes(interviewer.island)) {
          toast({
            title: "Error",
            description: `Interviewers from ${interviewer.island} are excluded from this project`,
            variant: "destructive",
          });
          throw new Error("Island excluded from project");
        }
        
        // If islands match or interviewer has no island, proceed with assignment
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
    },
    removeInterviewerFromProject: async (projectId: string, interviewerId: string) => {
      try {
        setLoading(true);
        
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
      } finally {
        setLoading(false);
      }
    },
    getProjectInterviewers,
    getInterviewerProjects,
    getProjectAssignments, // Export the new method
    refresh: loadProjects
  };
};
