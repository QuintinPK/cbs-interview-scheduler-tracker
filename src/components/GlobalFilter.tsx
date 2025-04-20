
import React from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useProjects } from '@/hooks/useProjects';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IslandSelector from '@/components/ui/IslandSelector';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const GlobalFilter: React.FC = () => {
  const { selectedProject, selectedIsland, setSelectedProject, setSelectedIsland, clearFilters } = useFilter();
  const { projects, loading } = useProjects();

  const handleProjectChange = (projectId: string) => {
    if (projectId === 'all') {
      setSelectedProject(null);
    } else {
      const project = projects.find(p => p.id === projectId) || null;
      setSelectedProject(project);
    }
  };

  const handleIslandChange = (island: 'Bonaire' | 'Saba' | 'Sint Eustatius' | 'all' | undefined) => {
    if (island === 'all') {
      setSelectedIsland(undefined);
    } else {
      setSelectedIsland(island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="w-64">
        <Select
          value={selectedProject?.id || 'all'}
          onValueChange={handleProjectChange}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-48">
        <IslandSelector
          selectedIsland={selectedIsland}
          onIslandChange={(island) => handleIslandChange(island)}
          placeholder="All Islands"
          showAllOption={true}
          disabled={loading}
        />
      </div>
      
      {(selectedProject || selectedIsland) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 px-2"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default GlobalFilter;
