
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface PeakSessionHoursChartProps {
  sessions: Session[];
  loading?: boolean;
}

const PeakSessionHoursChart: React.FC<PeakSessionHoursChartProps> = ({
  sessions,
  loading = false
}) => {
  const { chartData, averageSessionsPerHour, maxValue } = useMemo(() => {
    // Get start of week
    const day = startOfWeek.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
    
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
    
    // Calculate average sessions per hour
    const totalSessions = currentWeekSessions.length;
    const avgPerHour = totalSessions / 24;
    
    // Find max value for scaling
    const max = Math.max(...data.map(item => item.sessions));
    
    return { 
      chartData: data,
      averageSessionsPerHour: avgPerHour,
      maxValue: max > 0 ? max : 5 // Default scale if no data
    };
  }, [sessions]);
  
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-md shadow-md p-3">
        <p className="font-medium text-sm">{`${label}`}</p>
        <p className="text-primary text-sm">{`Sessions: ${payload[0].value}`}</p>
        <p className="text-muted-foreground text-xs mb-2">
          {payload[0].value > averageSessionsPerHour 
            ? `${((payload[0].value / averageSessionsPerHour - 1) * 100).toFixed(0)}% above average`
            : payload[0].value < averageSessionsPerHour 
              ? `${((1 - payload[0].value / averageSessionsPerHour) * 100).toFixed(0)}% below average` 
              : 'At average'}
        </p>

        {/* 🔽 Add your legend here */}
        <div className="mt-2 text-xs text-muted-foreground border-t pt-2 space-y-1">
          <p><span className="text-[#10b981]">■</span> High activity - green</p>
          <p><span className="text-[#6366f1]">■</span> Above average - indigo</p>
          <p><span className="text-[#8884d8]">■</span> Below average - purple</p>
        </div>
      </div>
    );
  }
  
    return null;
  };
  
  // Colors for bars
  const getBarColor = (value: number) => {
    if (value > averageSessionsPerHour * 1.5) return "#10b981"; // High activity - green
    if (value > averageSessionsPerHour) return "#6366f1"; // Above average - indigo
    if (value > 0) return "#8884d8"; // Below average - purple
    return "#d1d5db"; // No activity - gray
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Peak session hours (Week)</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <Info className="h-4 w-4 text-muted-foreground/70" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">Shows the distribution of sessions by hour of day for the current week (Mon-Sun). The horizontal line represents the average.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        {loading ? (
          <p className="text-muted-foreground text-center py-10">Loading...</p>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }}
                interval={2} // Show every third label to avoid crowding
              />
              <YAxis 
                allowDecimals={false} 
                domain={[0, Math.ceil(maxValue * 1.2)]} // Add 20% padding to top
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={averageSessionsPerHour} 
                stroke="#ff7c43" 
                strokeDasharray="3 3"
                label={{ 
                  value: 'Avg', 
                  position: 'right', 
                  fill: '#ff7c43', 
                  fontSize: 10 
                }} 
              />
              <Bar 
                dataKey="sessions"
                name="Sessions"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.sessions)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PeakSessionHoursChart;
