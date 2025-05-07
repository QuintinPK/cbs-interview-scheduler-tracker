
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface InterviewersSearchProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  filteredCount: number;
  selectedProject?: { name: string } | null;
  selectedIsland?: string | null;
}

const InterviewersSearch: React.FC<InterviewersSearchProps> = ({
  searchQuery,
  onSearchChange,
  loading,
  filteredCount,
  selectedProject,
  selectedIsland
}) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border">
      <div className="max-w-md relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by name, code, island, or email..."
          value={searchQuery}
          onChange={onSearchChange}
          disabled={loading}
          className="pl-9 border-gray-200 focus:border-cbs focus:ring-1 focus:ring-cbs"
        />
      </div>
      
      <div className="mt-2 text-sm text-muted-foreground flex items-center justify-between">
        <span>
          {filteredCount} interviewer{filteredCount !== 1 ? 's' : ''} found
        </span>
        {(selectedProject || selectedIsland) && (
          <span className="text-cbs">
            Filtered by: {selectedProject ? `Project: ${selectedProject.name}` : ''}
            {selectedProject && selectedIsland ? ' & ' : ''}
            {selectedIsland ? `Island: ${selectedIsland}` : ''}
          </span>
        )}
      </div>
    </div>
  );
};

export default InterviewersSearch;
