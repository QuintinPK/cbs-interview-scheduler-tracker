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
      
      setProjects(data || []);
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
      
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "New project added successfully",
      });
      
      setProjects([...projects, data]);
      return data;
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
      
      const { error } = await supabase
        .from('projects')
        .update(project)
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

  // Function to assign an interviewer to a project
  const assignInterviewerToProject = async (projectId: string, interviewerId: string) => {
    try {
      setLoading(true);
      
      // Check if this assignment already exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('project_interviewers')
        .select('*')
        .eq('project_id', projectId)
        .eq('interviewer_id', interviewerId)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw checkError;
      }
      
      if (existingAssignment) {
        toast({
          title: "Info",
          description: "Interviewer is already assigned to this project",
        });
        return;
      }
      
      // Create the new assignment
      const { error } = await supabase
        .from('project_interviewers')
        .insert([{
          project_id: projectId,
          interviewer_id: interviewerId
        }]);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Interviewer assigned to project successfully",
      });
    } catch (error) {
      console.error("Error assigning interviewer to project:", error);
      toast({
        title: "Error",
        description: "Could not assign interviewer to project",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to remove an interviewer from a project
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

  // Function to get all interviewers assigned to a project
  const getProjectInterviewers = async (projectId: string): Promise<Interviewer[]> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('project_interviewers')
        .select('interviewer_id')
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      // Get the full interviewer details
      const interviewerIds = data.map(pi => pi.interviewer_id);
      
      const { data: interviewers, error: interviewersError } = await supabase
        .from('interviewers')
        .select('*')
        .in('id', interviewerIds);
        
      if (interviewersError) throw interviewersError;
      
      // Map the database results to our Interviewer type
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

  // Function to get all projects an interviewer is assigned to
  const getInterviewerProjects = async (interviewerId: string): Promise<Project[]> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('project_interviewers')
        .select('project_id')
        .eq('interviewer_id', interviewerId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      // Get the full project details
      const projectIds = data.map(pi => pi.project_id);
      
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds);
        
      if (projectsError) throw projectsError;
      
      return projects || [];
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

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    assignInterviewerToProject,
    removeInterviewerFromProject,
    getProjectInterviewers,
    getInterviewerProjects,
    refresh: loadProjects
  };
};
