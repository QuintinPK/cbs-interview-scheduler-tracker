
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session } from "@/types";
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

interface PeakSessionHoursChartProps {
  sessions: Session[];
  loading?: boolean;
}

const PeakSessionHoursChart: React.FC<PeakSessionHoursChartProps> = ({
  sessions,
  loading = false
}) => {
  const chartData = useMemo(() => {
    // Get start of week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Initialize data for each hour of the day
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const data = hours.map(hour => ({
      hour,
      label: `${hour}:00`,
      sessions: 0
    }));
    
    // Filter sessions for current week
    const currentWeekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      return sessionDate >= startOfWeek;
    });
    
    // Populate data
    currentWeekSessions.forEach(session => {
      const sessionDate = new Date(session.start_time);
      const hour = sessionDate.getHours();
      
      data[hour].sessions += 1;
    });
    
    return data;
  }, [sessions]);
  
  const chartConfig = {
    sessions: {
      label: "Sessions",
      theme: {
        light: "#059669",
        dark: "#10b981"
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Peak Session Hours (Week)</CardTitle>
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
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }}
                interval={2} // Show every third label to avoid crowding
              />
              <YAxis allowDecimals={false} />
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

export default PeakSessionHoursChart;
