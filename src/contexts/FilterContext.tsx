
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project } from '@/types';

interface FilterContextType {
  selectedProject: Project | null;
  selectedIsland: 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined;
  setSelectedProject: (project: Project | null) => void;
  setSelectedIsland: (island: 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedIsland, setSelectedIsland] = useState<'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined>(undefined);

  const clearFilters = () => {
    setSelectedProject(null);
    setSelectedIsland(undefined);
  };

  return (
    <FilterContext.Provider value={{
      selectedProject,
      selectedIsland,
      setSelectedProject,
      setSelectedIsland,
      clearFilters
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
