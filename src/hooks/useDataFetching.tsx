
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Session, Interviewer, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useFilter } from '@/contexts/FilterContext';

export const useDataFetching = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [interviewerProjects, setInterviewerProjects] = useState<Record<string, Project[]>>({});
  
  // Add null check for filter context
  const filterContext = useFilter();
  const { selectedProject, selectedIsland, filterSessions, filterInterviewers, filterProjects } = filterContext || {
    selectedProject: null,
    selectedIsland: undefined,
    filterSessions: (sessions: Session[]) => sessions,
    filterInterviewers: (interviewers: Interviewer[]) => interviewers,
    filterProjects: (projects: Project[]) => projects
  };

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
      
      // Fetch project-interviewer assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('project_interviewers')
        .select('*');
        
      if (assignmentsError) throw assignmentsError;
      
      // Set data with proper type casting
      const typedInterviewers = interviewersData?.map(interviewer => ({
        ...interviewer,
        island: interviewer.island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined
      })) || [];
      
      setSessions(sessionsData || []);
      
      const typedProjects = projectsData?.map(project => ({
        ...project,
        excluded_islands: project.excluded_islands as ('Bonaire' | 'Saba' | 'Sint Eustatius')[]
      })) || [];
      
      setProjects(typedProjects);
      setInterviewers(typedInterviewers);
      
      // Process project assignments
      const projectAssignments: Record<string, Project[]> = {};
      
      if (assignmentsData) {
        for (const assignment of assignmentsData) {
          const project = typedProjects.find(p => p.id === assignment.project_id);
          if (project) {
            if (!projectAssignments[assignment.interviewer_id]) {
              projectAssignments[assignment.interviewer_id] = [];
            }
            projectAssignments[assignment.interviewer_id].push(project);
          }
        }
      }
      
      setInterviewerProjects(projectAssignments);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent crashes
      setSessions([]);
      setInterviewers([]);
      setProjects([]);
      setInterviewerProjects({});
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Apply filters to the data with better null checks
  const filteredSessions = useMemo(() => {
    if (!sessions?.length || (!selectedProject && !selectedIsland)) return sessions;
    
    try {
      let filtered = filterSessions ? filterSessions(sessions) : sessions;
      
      // Further filter by island if needed
      if (selectedIsland && interviewers?.length > 0) {
        filtered = filtered.filter(session => {
          const interviewer = interviewers.find(i => i?.id === session?.interviewer_id);
          return interviewer?.island === selectedIsland;
        });
      }
      
      return filtered;
    } catch (error) {
      console.error('Error filtering sessions:', error);
      return sessions;
    }
  }, [sessions, interviewers, selectedProject, selectedIsland, filterSessions]);
  
  const filteredInterviewers = useMemo(() => {
    if (!interviewers?.length || (!selectedIsland && !selectedProject)) return interviewers;
    
    try {
      // Now use the interviewerProjects data for filtering by project
      return filterInterviewers ? filterInterviewers(interviewers, interviewerProjects) : interviewers;
    } catch (error) {
      console.error('Error filtering interviewers:', error);
      return interviewers;
    }
  }, [interviewers, selectedIsland, selectedProject, filterInterviewers, interviewerProjects]);
  
  const filteredProjects = useMemo(() => {
    if (!projects?.length || !selectedIsland) return projects;
    
    try {
      return filterProjects ? filterProjects(projects) : projects;
    } catch (error) {
      console.error('Error filtering projects:', error);
      return projects;
    }
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
