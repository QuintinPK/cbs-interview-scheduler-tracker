
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import IslandSelector from "@/components/projects/IslandSelector";
import ProjectSelector from "@/components/projects/ProjectSelector";
import { Island, Project } from "@/types";
import { useProjects } from "@/hooks/useProjects";

interface SessionFiltersProps {
  interviewerCodeFilter: string;
  setInterviewerCodeFilter: (value: string) => void;
  dateFilter: Date | undefined;
  setDateFilter: (date: Date | undefined) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  loading: boolean;
  islandFilter?: Island | null;
  setIslandFilter?: (island: Island | null) => void;
  projectFilter?: string | null;
  setProjectFilter?: (projectId: string | null) => void;
}

const SessionFilters: React.FC<SessionFiltersProps> = ({
  interviewerCodeFilter,
  setInterviewerCodeFilter,
  dateFilter,
  setDateFilter,
  applyFilters,
  resetFilters,
  loading,
  islandFilter = null,
  setIslandFilter,
  projectFilter = null,
  setProjectFilter
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { projects: allProjects, loading: projectsLoading } = useProjects(islandFilter);
  
  useEffect(() => {
    setProjects(allProjects);
    // Reset project filter when island changes
    if (setProjectFilter && projectFilter) {
      // Check if the current project is from this island
      const projectExists = allProjects.some(p => p.id === projectFilter);
      if (!projectExists) {
        setProjectFilter(null);
      }
    }
  }, [allProjects, islandFilter]);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h2 className="font-semibold mb-4">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="interviewer-filter">Interviewer Code</Label>
          <Input
            id="interviewer-filter"
            placeholder="Filter by interviewer code"
            value={interviewerCodeFilter}
            onChange={(e) => setInterviewerCodeFilter(e.target.value)}
            disabled={loading}
          />
        </div>
        
        {setIslandFilter && (
          <IslandSelector
            selectedIsland={islandFilter}
            onIslandChange={setIslandFilter}
            loading={loading}
            placeholder="All Islands"
          />
        )}
        
        {setProjectFilter && (
          <ProjectSelector
            projects={projects}
            selectedProjectId={projectFilter}
            onProjectChange={setProjectFilter}
            loading={loading || projectsLoading}
            placeholder="All Projects"
          />
        )}
        
        <div>
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
                disabled={loading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="md:col-span-2 lg:col-span-4 flex items-end gap-2 mt-2">
          <Button 
            onClick={applyFilters} 
            className="bg-cbs hover:bg-cbs-light"
            disabled={loading}
          >
            Apply Filters
          </Button>
          <Button 
            onClick={resetFilters} 
            variant="outline"
            disabled={loading}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionFilters;
