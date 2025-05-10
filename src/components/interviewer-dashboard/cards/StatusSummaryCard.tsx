import React from "react";
import { TrendingUp, Activity, Users } from "lucide-react";
import { Session } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

interface StatusSummaryCardProps {
  activeSessions: Session[];
  totalSessions: number;
}

export const StatusSummaryCard: React.FC<StatusSummaryCardProps> = ({
  activeSessions,
  totalSessions,
}) => {
  return (
    <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
      <h3 className="font-medium flex items-center text-primary mb-2">
        <TrendingUp className="h-4 w-4 mr-2 opacity-70" />
        Status Summary
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 cursor-help">
                <Activity className="h-3 w-3 text-muted-foreground/70" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">Displays the interviewer's current status (active or inactive) and total number of sessions completed. This gives a quick overview of their current state and overall productivity.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Status</p>
          <div className="flex items-center mt-1">
            <div className={`h-2 w-2 rounded-full mr-2 ${activeSessions.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <p>{activeSessions.length > 0 ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Sessions</p>
          <p className="text-xl font-medium flex items-center">
            <Users className="h-4 w-4 mr-1 opacity-70" />
            {totalSessions}
          </p>
        </div>
      </div>
    </div>
  );
};
