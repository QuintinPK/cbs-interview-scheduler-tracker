
import React from "react";
import { Award, Activity, Timer } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionsMetricsCardProps {
  sessionsInPlanTime: number;
  avgSessionDuration: string;
}

export const SessionsMetricsCard: React.FC<SessionsMetricsCardProps> = ({
  sessionsInPlanTime,
  avgSessionDuration,
}) => {
  return (
    <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
      <h3 className="font-medium flex items-center text-primary mb-2">
        <Award className="h-4 w-4 mr-2 opacity-70" />
        Sessions Metrics
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 cursor-help">
                <Activity className="h-3 w-3 text-muted-foreground/70" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">Metrics on session adherence to planned timeframes and average session duration. High adherence to planned times indicates good schedule discipline, while average duration helps understand typical workload.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Within Planned Timeframe</p>
          <div className="flex items-center mt-1">
            <div className="h-2 bg-gray-200 rounded-full w-full">
              <div 
                className="h-2 bg-primary rounded-full" 
                style={{ width: `${Math.min(100, sessionsInPlanTime)}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium">{sessionsInPlanTime.toFixed(0)}%</span>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Average Duration</p>
          <p className="text-xl font-medium flex items-center">
            <Timer className="h-4 w-4 mr-1 opacity-70" />
            {avgSessionDuration}
          </p>
        </div>
      </div>
    </div>
  );
};
