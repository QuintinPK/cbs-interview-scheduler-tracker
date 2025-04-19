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

  const assignInterviewerToProject = async (projectId: string, interviewerId: string) => {
    try {
      setLoading(true);
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      const { data: interviewer, error: interviewerError } = await supabase
        .from('interviewers')
        .select('*')
        .eq('id', interviewerId)
        .single();
        
      if (interviewerError) throw interviewerError;
      
      if (interviewer.island && project.island && interviewer.island !== project.island) {
        toast({
          title: "Error",
          description: "Interviewers can only be assigned to projects on their island",
          variant: "destructive",
        });
        throw new Error("Island mismatch");
      }
      
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
      if (!(error instanceof Error) || error.message !== "Island mismatch") {
        toast({
          title: "Error",
          description: "Could not assign interviewer to project",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setLoading(false);
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
