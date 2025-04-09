
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session } from "@/types";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface WeeklySessionsChartProps {
  sessions: Session[];
  loading?: boolean;
}

const WeeklySessionsChart: React.FC<WeeklySessionsChartProps> = ({
  sessions,
  loading = false
}) => {
  const chartData = useMemo(() => {
    // Get start of week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Initialize data for each day of the week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = days.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + index);
      
      return {
        day: day,
        date: date.toISOString().split('T')[0],
        sessions: 0
      };
    });
    
    // Filter sessions for current week
    const currentWeekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      return sessionDate >= startOfWeek;
    });
    
    // Populate data
    currentWeekSessions.forEach(session => {
      const sessionDate = new Date(session.start_time);
      const dayIndex = sessionDate.getDay();
      
      if (data[dayIndex]) {
        data[dayIndex].sessions += 1;
      }
    });
    
    // Calculate average
    const totalSessions = data.reduce((sum, item) => sum + item.sessions, 0);
    const averageSessions = totalSessions / 7;
    
    // Add average to data
    return data.map(item => ({
      ...item,
      average: parseFloat(averageSessions.toFixed(1))
    }));
  }, [sessions]);
  
  const chartConfig = {
    sessions: {
      label: "Sessions",
      theme: {
        light: "#2563eb",
        dark: "#3b82f6"
      }
    },
    average: {
      label: "Average",
      theme: {
        light: "#dc2626",
        dark: "#ef4444"
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sessions this week</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {loading ? (
          <p className="text-muted-foreground text-center py-10">Loading...</p>
        ) : (
          <ChartContainer 
            config={chartConfig} 
            className="h-full w-full"
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.substring(0, 3)}
              />
              <YAxis allowDecimals={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="var(--color-sessions)"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="average (total)" 
                stroke="var(--color-average)" 
                strokeWidth={2}
                strokeDasharray="5 5" 
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklySessionsChart;
