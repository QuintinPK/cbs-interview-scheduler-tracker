
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Project, ProjectInterviewer, Interviewer, Island } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useProjects = (island?: Island) => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadProjects = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('projects').select('*');
      
      if (island) {
        query = query.eq('island', island);
      }
      
      const { data, error } = await query.order('name');
        
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
  }, [island]);

  const addProject = async (project: Omit<Project, 'id' | 'created_at'>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('projects')
        .insert([project]);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "New project added successfully",
      });
      
      await loadProjects();
      return true;
    } catch (error) {
      console.error("Error adding project:", error);
      toast({
        title: "Error",
        description: "Could not add project",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, project: Omit<Project, 'id' | 'created_at'>) => {
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
      
      await loadProjects();
      return true;
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Could not update project",
        variant: "destructive",
      });
      return false;
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
      
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      
      setProjects(projects.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Could not delete project",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const assignInterviewerToProject = async (projectId: string, interviewerId: string) => {
    try {
      const { error } = await supabase
        .from('project_interviewers')
        .insert([{ project_id: projectId, interviewer_id: interviewerId }]);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Interviewer assigned to project successfully",
      });
      return true;
    } catch (error) {
      console.error("Error assigning interviewer to project:", error);
      toast({
        title: "Error",
        description: "Could not assign interviewer to project",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeInterviewerFromProject = async (projectId: string, interviewerId: string) => {
    try {
      const { error } = await supabase
        .from('project_interviewers')
        .delete()
        .match({ project_id: projectId, interviewer_id: interviewerId });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Interviewer removed from project successfully",
      });
      return true;
    } catch (error) {
      console.error("Error removing interviewer from project:", error);
      toast({
        title: "Error",
        description: "Could not remove interviewer from project",
        variant: "destructive",
      });
      return false;
    }
  };

  const getProjectInterviewers = async (projectId: string): Promise<Interviewer[]> => {
    try {
      const { data, error } = await supabase
        .from('project_interviewers')
        .select(`
          interviewer_id,
          interviewers:interviewer_id(*)
        `)
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      return data.map((item: any) => item.interviewers) || [];
    } catch (error) {
      console.error("Error fetching project interviewers:", error);
      toast({
        title: "Error",
        description: "Could not fetch interviewers for this project",
        variant: "destructive",
      });
      return [];
    }
  };

  const getInterviewerProjects = async (interviewerId: string): Promise<Project[]> => {
    try {
      const { data, error } = await supabase
        .from('project_interviewers')
        .select(`
          project_id,
          projects:project_id(*)
        `)
        .eq('interviewer_id', interviewerId);
        
      if (error) throw error;
      
      return data.map((item: any) => item.projects) || [];
    } catch (error) {
      console.error("Error fetching interviewer projects:", error);
      toast({
        title: "Error",
        description: "Could not fetch projects for this interviewer",
        variant: "destructive",
      });
      return [];
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
