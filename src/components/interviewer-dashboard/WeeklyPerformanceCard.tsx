
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WeeklyPerformanceCardProps {
  weeklyAverage: number;
  allInterviewersWeeklyAverage: number;
}

export const WeeklyPerformanceCard: React.FC<WeeklyPerformanceCardProps> = ({
  weeklyAverage,
  allInterviewersWeeklyAverage
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Performance</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <Info className="h-4 w-4 text-muted-foreground/70" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">This metric shows the average hours worked per week over all of the interviewer's sessions. A higher weekly average indicates greater productivity and availability, and you can compare against the all-interviewers average to see how this interviewer ranks among peers.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Your Weekly Average</p>
            <p className="text-2xl font-bold">{weeklyAverage.toFixed(1)}h</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">All Interviewers Average</p>
            <p className="text-2xl font-bold">{allInterviewersWeeklyAverage.toFixed(1)}h</p>
            <p className="text-sm text-muted-foreground">
              {weeklyAverage > allInterviewersWeeklyAverage ? 
                `+${((weeklyAverage / allInterviewersWeeklyAverage - 1) * 100).toFixed(1)}% above average` :
                `${((1 - weeklyAverage / allInterviewersWeeklyAverage) * 100).toFixed(1)}% below average`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
