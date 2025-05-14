
import React from "react";
import { Clock, Activity } from "lucide-react";
import { formatTime } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkingHoursCardProps {
  earliestStartTime: Date | null;
  latestEndTime: Date | null;
}

export const WorkingHoursCard: React.FC<WorkingHoursCardProps> = ({
  earliestStartTime,
  latestEndTime,
}) => {
  return (
    <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
      <h3 className="font-medium flex items-center text-primary mb-2">
        <Clock className="h-4 w-4 mr-2 opacity-70" />
        Working Hours
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 cursor-help">
                <Activity className="h-3 w-3 text-muted-foreground/70" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">Shows the typical working pattern of the interviewer by displaying the earliest they start work and the latest they finish. This helps understand their availability and productivity windows.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Earliest Start</p>
          <p className="text-xl font-medium">
            {earliestStartTime ? formatTime(earliestStartTime) : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Latest End</p>
          <p className="text-xl font-medium">
            {latestEndTime ? formatTime(latestEndTime) : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};
