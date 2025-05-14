
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdditionalMetricsCardProps {
  completionRate: number;
  totalInterviews: number;
}

export const AdditionalMetricsCard: React.FC<AdditionalMetricsCardProps> = ({
  completionRate,
  totalInterviews
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Additional Metrics</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <Info className="h-4 w-4 text-muted-foreground/70" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">The response rate indicates how successful the interviewer is at completing surveys. A higher response rate (closer to 100%) suggests the interviewer is more effective at engaging participants and obtaining completed surveys. The total interviews count shows overall activity level.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Response Rate</p>
            <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Total Interviews</p>
            <p className="text-2xl font-bold">{totalInterviews}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
