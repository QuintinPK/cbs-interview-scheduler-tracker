
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortField = 'interviewer_code' | 'project' | 'duration' | 'start_time' | 'end_time';
type SortDirection = 'asc' | 'desc';

interface SortableHeaderProps {
  field: SortField;
  children: React.ReactNode;
  sortField: SortField | null;
  sortDirection: SortDirection;
  toggleSort: (field: SortField) => void;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  children,
  sortField,
  sortDirection,
  toggleSort,
}) => (
  <Button
    variant="ghost"
    className={cn(
      "h-8 flex items-center gap-1 -ml-2 font-medium",
      "hover:bg-accent hover:text-accent-foreground",
      "transition-colors duration-200",
      "group"
    )}
    onClick={() => toggleSort(field)}
  >
    <span className="group-hover:text-primary">{children}</span>
    <div className="w-4">
      {sortField === field ? (
        sortDirection === 'asc' ? 
          <ArrowUp className="h-3 w-3 text-primary" /> : 
          <ArrowDown className="h-3 w-3 text-primary" />
      ) : (
        <div className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ArrowUp className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
    </div>
  </Button>
);
