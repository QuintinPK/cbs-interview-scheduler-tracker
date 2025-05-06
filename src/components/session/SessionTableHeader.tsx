
import React from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type SortField = 'interviewer_code' | 'project' | 'duration' | 'start_time' | 'end_time';
type SortDirection = 'asc' | 'desc';

interface SessionTableHeaderProps {
  sortField: SortField | null;
  sortDirection: SortDirection;
  toggleSort: (field: SortField) => void;
}

export const SessionTableHeader: React.FC<SessionTableHeaderProps> = ({
  sortField,
  sortDirection,
  toggleSort,
}) => {
  const SortableHeader: React.FC<{
    field: SortField;
    children: React.ReactNode;
  }> = ({ field, children }) => (
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

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-10"></TableHead>
        <TableHead>
          <SortableHeader field="interviewer_code">
            Interviewer Code
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader field="project">
            Project
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader field="start_time">
            Start Date/Time
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader field="end_time">
            End Date/Time
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader field="duration">
            Duration
          </SortableHeader>
        </TableHead>
        <TableHead>Start Location</TableHead>
        <TableHead>End Location</TableHead>
        <TableHead>Interviews</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
