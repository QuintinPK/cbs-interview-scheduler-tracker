
import { useState, useEffect } from "react";
import { Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useActiveProject = (sessionId?: string, interviewerId?: string) => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActiveProject = async () => {
      if (!sessionId && !interviewerId) return;
      
      try {
        setLoading(true);
        
        if (sessionId) {
          // Get project from session
          const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('project_id')
            .eq('id', sessionId)
            .single();
            
          if (sessionError) throw sessionError;
          
          if (session.project_id) {
            const { data: project, error: projectError } = await supabase
              .from('projects')
              .select('*')
              .eq('id', session.project_id)
              .single();
              
            if (projectError) throw projectError;
            
            setActiveProject(project);
          }
        } else if (interviewerId) {
          // Get the most recent session for this interviewer to determine active project
          const { data: sessions, error: sessionsError } = await supabase
            .from('sessions')
            .select('project_id')
            .eq('interviewer_id', interviewerId)
            .order('start_time', { ascending: false })
            .limit(1);
            
          if (sessionsError) throw sessionsError;
          
          if (sessions && sessions.length > 0 && sessions[0].project_id) {
            const { data: project, error: projectError } = await supabase
              .from('projects')
              .select('*')
              .eq('id', sessions[0].project_id)
              .single();
              
            if (projectError) throw projectError;
            
            setActiveProject(project);
          }
        }
      } catch (error) {
        console.error("Error fetching active project:", error);
        setActiveProject(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActiveProject();
  }, [sessionId, interviewerId]);

  return { activeProject, loading };
};
