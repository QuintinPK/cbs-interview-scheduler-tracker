
import React from "react";
import { Briefcase, Activity } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DaysWorkedCardProps {
  avgDaysPerWeek: number;
  daysWorkedInMonth: number;
}

export const DaysWorkedCard: React.FC<DaysWorkedCardProps> = ({
  avgDaysPerWeek,
  daysWorkedInMonth,
}) => {
  return (
    <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
      <h3 className="font-medium flex items-center text-primary mb-2">
        <Briefcase className="h-4 w-4 mr-2 opacity-70" />
        Days Worked
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 cursor-help">
                <Activity className="h-3 w-3 text-muted-foreground/70" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">Shows how frequently the interviewer works, both as an average per week and the total number of days worked in the past month. This helps measure consistency and workload distribution.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Per Week</p>
          <p className="text-xl font-medium">{avgDaysPerWeek.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Past Month</p>
          <p className="text-xl font-medium">{daysWorkedInMonth}</p>
        </div>
      </div>
    </div>
  );
};
