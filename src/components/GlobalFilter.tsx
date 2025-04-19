
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
    const project = projects.find(p => p.id === projectId) || null;
    setSelectedProject(project);
    
    // No longer setting island from project since it doesn't have an island property
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="w-64">
        <Select
          value={selectedProject?.id || ''}
          onValueChange={handleProjectChange}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Project" />
          </SelectTrigger>
          <SelectContent>
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
          onIslandChange={setSelectedIsland}
          placeholder="Filter by Island"
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
