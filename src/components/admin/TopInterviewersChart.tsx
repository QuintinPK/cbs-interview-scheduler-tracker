
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface TopInterviewersChartProps {
  sessions: Session[];
  interviewers: Interviewer[];
  loading?: boolean;
}

const TopInterviewersChart: React.FC<TopInterviewersChartProps> = ({
  sessions,
  interviewers,
  loading = false
}) => {
  const chartData = useMemo(() => {
    // Count sessions per interviewer
    const interviewerCounts = sessions.reduce((acc, session) => {
      const interviewerId = session.interviewer_id;
      acc[interviewerId] = (acc[interviewerId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Create data for chart
    const data = Object.entries(interviewerCounts).map(([interviewerId, count]) => {
      const interviewer = interviewers.find(i => i.id === interviewerId);
      return {
        interviewerId,
        code: interviewer ? interviewer.code : "Unknown",
        sessions: count
      };
    });
    
    // Sort and limit to top 10
    return data.sort((a, b) => b.sessions - a.sessions).slice(0, 10);
  }, [sessions, interviewers]);
  
  const chartConfig = {
    sessions: {
      label: "Sessions",
      theme: {
        light: "#2563eb",
        dark: "#3b82f6"
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top 10 Interviewers</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {loading ? (
          <p className="text-muted-foreground text-center py-10">Loading...</p>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No data available</p>
        ) : (
          <ChartContainer 
            config={chartConfig} 
            className="h-full w-full"
          >
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="code" 
                type="category" 
                width={80} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="sessions" 
                fill="var(--color-sessions)" 
                name="Sessions"
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TopInterviewersChart;
