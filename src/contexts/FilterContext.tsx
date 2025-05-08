
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Project, Interviewer, Session } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface FilterContextType {
  selectedProject: Project | null;
  selectedIsland: 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined;
  setSelectedProject: (project: Project | null) => void;
  setSelectedIsland: (island: 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined) => void;
  clearFilters: () => void;
  filterInterviewers: (interviewers: Interviewer[], interviewerProjects?: Record<string, Project[]>) => Interviewer[];
  filterSessions: (sessions: Session[]) => Session[];
  filterProjects: (projects: Project[]) => Project[];
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  responseRate: number;
  setResponseRate: (rate: number) => void;
  nonResponseRate: number;
  setNonResponseRate: (rate: number) => void;
  showResponseRates: boolean;
  setShowResponseRates: (show: boolean) => void;
  getRates: () => Promise<void>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedIsland, setSelectedIsland] = useState<'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined>(undefined);
  const [projectTitle, setProjectTitle] = useState<string>('CBS Interview System');
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [responseRate, setResponseRate] = useState<number>(0);
  const [nonResponseRate, setNonResponseRate] = useState<number>(0);
  const [showResponseRates, setShowResponseRates] = useState<boolean>(false);

  const clearFilters = () => {
    setSelectedProject(null);
    setSelectedIsland(undefined);
  };

  // Filter interviewers based on selected project and island
  const filterInterviewers = (
    interviewers: Interviewer[], 
    interviewerProjects?: Record<string, Project[]>
  ): Interviewer[] => {
    return interviewers.filter(interviewer => {
      // Filter by island
      const matchesIsland = !selectedIsland || interviewer.island === selectedIsland;
      
      // Filter by project if interviewerProjects is provided
      let matchesProject = true;
      if (selectedProject && interviewerProjects) {
        // Only include interviewers that have the selected project assigned
        const projects = interviewerProjects[interviewer.id] || [];
        matchesProject = projects.some(project => project.id === selectedProject.id);
      }
      
      return matchesIsland && matchesProject;
    });
  };

  // Filter sessions based on selected project and island
  const filterSessions = (sessions: Session[]): Session[] => {
    return sessions.filter(session => {
      // Project filter
      const matchesProject = !selectedProject || session.project_id === selectedProject.id;
      
      // For island filter, we need to check the interviewer's island
      // This will be done in the component using this filter since we need interviewer data
      
      return matchesProject;
    });
  };

  // Filter projects based on selected island
  const filterProjects = (projects: Project[]): Project[] => {
    return projects.filter(project => {
      // Island filter - show project if it's not excluded for the selected island
      const matchesIsland = !selectedIsland || !project.excluded_islands.includes(selectedIsland);
      
      return matchesIsland;
    });
  };

  // Get rates from Supabase
  const getRates = useCallback(async () => {
    try {
      const { data: settingsData, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      if (settingsData) {
        setHourlyRate(settingsData.hourly_rate || 0);
        setResponseRate(settingsData.response_rate || 0);
        setNonResponseRate(settingsData.non_response_rate || 0);
        setShowResponseRates(settingsData.show_response_rates || false);
        setProjectTitle(settingsData.project_title || 'CBS Interview System');
      }
    } catch (error) {
      console.error('Error in getRates:', error);
    }
  }, []);

  useEffect(() => {
    getRates();
  }, [getRates]);

  return (
    <FilterContext.Provider value={{
      selectedProject,
      selectedIsland,
      setSelectedProject,
      setSelectedIsland,
      clearFilters,
      filterInterviewers,
      filterSessions,
      filterProjects,
      projectTitle,
      setProjectTitle,
      hourlyRate,
      setHourlyRate,
      responseRate,
      setResponseRate,
      nonResponseRate,
      setNonResponseRate,
      showResponseRates,
      setShowResponseRates,
      getRates
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
