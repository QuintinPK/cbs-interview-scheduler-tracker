
import React from 'react';
import { Interview } from '@/types';
import { TableCell, TableRow } from "@/components/ui/table";
import { InterviewItem } from './InterviewItem';

interface InterviewsListProps {
  interviews: Interview[];
  showProject: boolean;
}

export const InterviewsList: React.FC<InterviewsListProps> = ({ 
  interviews, 
  showProject 
}) => {
  return (
    <TableRow>
      <TableCell colSpan={showProject ? 8 : 7} className="p-0 border-t-0">
        <div className="bg-gray-50 pl-12 pr-4 py-4">
          <div className="space-y-2">
            {interviews.map((interview) => (
              <InterviewItem key={interview.id} interview={interview} />
            ))}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};
