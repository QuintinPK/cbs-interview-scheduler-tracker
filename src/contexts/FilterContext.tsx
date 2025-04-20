
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project, Interviewer, Session } from '@/types';

interface FilterContextType {
  selectedProject: Project | null;
  selectedIsland: 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined;
  setSelectedProject: (project: Project | null) => void;
  setSelectedIsland: (island: 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined) => void;
  clearFilters: () => void;
  filterInterviewers: (interviewers: Interviewer[]) => Interviewer[];
  filterSessions: (sessions: Session[]) => Session[];
  filterProjects: (projects: Project[]) => Project[];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedIsland, setSelectedIsland] = useState<'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined>(undefined);

  const clearFilters = () => {
    setSelectedProject(null);
    setSelectedIsland(undefined);
  };

  // Filter interviewers based on selected project and island
  const filterInterviewers = (interviewers: Interviewer[]): Interviewer[] => {
    return interviewers.filter(interviewer => {
      // Filter by island
      const matchesIsland = !selectedIsland || interviewer.island === selectedIsland;
      
      // For project filtering, we'll need to handle this where the project assignments are available
      // since this is just the generic filter
      
      return matchesIsland;
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

  return (
    <FilterContext.Provider value={{
      selectedProject,
      selectedIsland,
      setSelectedProject,
      setSelectedIsland,
      clearFilters,
      filterInterviewers,
      filterSessions,
      filterProjects
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
