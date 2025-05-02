
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface InterviewDurationCardProps {
  averageTimePerType: {
    response: number;
    nonResponse: number;
  };
}

export const InterviewDurationCard: React.FC<InterviewDurationCardProps> = ({
  averageTimePerType
}) => {
  const interviewDurationData = [
    {
      name: 'Response',
      minutes: averageTimePerType.response,
    },
    {
      name: 'Non-Response',
      minutes: averageTimePerType.nonResponse,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-md shadow-md p-3">
          <p className="font-medium text-sm">{`${label} Interviews`}</p>
          <p className="text-primary text-sm">{`Average Duration: ${payload[0].value.toFixed(1)} minutes`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Interview Duration Analysis</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <Info className="h-4 w-4 text-muted-foreground/70" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">This chart shows how much time the interviewer typically spends on different types of interviews. Response interviews are those where the interviewer successfully completes the survey, while non-response interviews are unsuccessful attempts. Ideally, non-response interviews should be shorter than response interviews to maximize efficiency.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Average Time per Response</p>
            <p className="text-2xl font-bold">{averageTimePerType.response.toFixed(1)} minutes</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Average Time per Non-Response</p>
            <p className="text-2xl font-bold">{averageTimePerType.nonResponse.toFixed(1)} minutes</p>
          </div>
        </div>
        
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={interviewDurationData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="minutes" 
                name="Average Duration (minutes)" 
                fill="#8884d8" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
