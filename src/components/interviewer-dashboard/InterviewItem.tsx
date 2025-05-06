
import React from 'react';
import { Interview } from '@/types';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { calculateDuration } from '@/utils/sessionUtils';

interface InterviewItemProps {
  interview: Interview;
}

export const InterviewItem: React.FC<InterviewItemProps> = ({ interview }) => {
  return (
    <div className="bg-white p-3 rounded border">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium">
              {format(parseISO(interview.start_time), "MMM d, yyyy • h:mm a")}
            </span>
            {interview.result && (
              <Badge variant={interview.result === 'response' ? 'success' : 'destructive'}>
                {interview.result === 'response' ? 'Response' : 'Non-response'}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Duration: {interview.end_time 
              ? calculateDuration(interview.start_time, interview.end_time) 
              : "Ongoing"}
          </div>
        </div>
      </div>
    </div>
  );
};
