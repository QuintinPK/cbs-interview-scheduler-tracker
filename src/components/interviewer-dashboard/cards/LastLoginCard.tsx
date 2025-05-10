import React from "react";
import { Clock, Activity } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

interface LastLoginCardProps {
  daysSinceLastActive: number;
}

export const LastLoginCard: React.FC<LastLoginCardProps> = ({
  daysSinceLastActive,
}) => {
  return (
    <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
      <h3 className="font-medium flex items-center text-primary mb-2">
        <Clock className="h-4 w-4 mr-2 opacity-70" />
        Time Since Last Login
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 cursor-help">
                <Activity className="h-3 w-3 text-muted-foreground/70" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">Number of days that have passed since the interviewer last logged into the system. This helps track interviewer engagement and identify inactive interviewers who may need follow-up.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      <p className="text-muted-foreground">
        {daysSinceLastActive === 0
          ? "Active today"
          : daysSinceLastActive === -1 
            ? "Never active"
            : `${daysSinceLastActive} day(s) ago`
        }
      </p>
    </div>
  );
};
