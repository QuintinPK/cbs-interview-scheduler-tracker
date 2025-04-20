
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Session, Interviewer, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useFilter } from '@/contexts/FilterContext';

export const useDataFetching = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProject, selectedIsland, filterSessions, filterInterviewers, filterProjects } = useFilter();

  // Function to fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch interviewers
      const { data: interviewersData, error: interviewersError } = await supabase
        .from('interviewers')
        .select('*')
        .order('code');
      
      if (interviewersError) throw interviewersError;
      
      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (sessionsError) throw sessionsError;
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      
      if (projectsError) throw projectsError;
      
      // Set data with proper type casting
      setInterviewers(interviewersData?.map(interviewer => ({
        ...interviewer,
        island: interviewer.island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined
      })) || []);
      
      setSessions(sessionsData || []);
      
      setProjects(projectsData?.map(project => ({
        ...project,
        excluded_islands: project.excluded_islands as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
      })) || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Apply filters to the data
  const filteredSessions = useMemo(() => {
    if (!selectedProject && !selectedIsland) return sessions;
    
    let filtered = filterSessions(sessions);
    
    // Further filter by island if needed
    if (selectedIsland) {
      filtered = filtered.filter(session => {
        const interviewer = interviewers.find(i => i.id === session.interviewer_id);
        return interviewer && interviewer.island === selectedIsland;
      });
    }
    
    return filtered;
  }, [sessions, interviewers, selectedProject, selectedIsland, filterSessions]);
  
  const filteredInterviewers = useMemo(() => {
    if (!selectedIsland && !selectedProject) return interviewers;
    
    let filtered = filterInterviewers(interviewers);
    
    // Further filter by project if needed - this requires project assignments
    // which would be handled in the component using this data
    
    return filtered;
  }, [interviewers, selectedIsland, selectedProject, filterInterviewers]);
  
  const filteredProjects = useMemo(() => {
    if (!selectedIsland) return projects;
    return filterProjects(projects);
  }, [projects, selectedIsland, filterProjects]);

  return {
    sessions: filteredSessions,
    interviewers: filteredInterviewers,
    projects: filteredProjects,
    allSessions: sessions, // Original unfiltered sessions
    allInterviewers: interviewers, // Original unfiltered interviewers
    allProjects: projects, // Original unfiltered projects
    loading,
    refresh: fetchData
  };
};
