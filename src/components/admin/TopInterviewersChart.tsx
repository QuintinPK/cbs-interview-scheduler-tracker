import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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
  // Initialize date range to current week (Monday to Sunday)
  const today = new Date();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const thisSunday = endOfWeek(today, { weekStartsOn: 1 });
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: thisMonday,
    to: thisSunday
  });
  
  const chartData = useMemo(() => {
    // Filter sessions by date range if set
    const filteredSessions = sessions.filter(session => {
      if (!dateRange?.from) return true;
      
      const sessionDate = new Date(session.start_time);
      const from = dateRange.from;
      const to = dateRange.to || from;
      
      return isWithinInterval(sessionDate, { 
        start: new Date(from.setHours(0, 0, 0, 0)), 
        end: new Date(to.setHours(23, 59, 59, 999)) 
      });
    });
    
    // Count sessions per interviewer
    const interviewerCounts: Record<string, number> = {};
    
    // Initialize all interviewers with 0 sessions
    interviewers.forEach(interviewer => {
      interviewerCounts[interviewer.id] = 0;
    });
    
    // Count the sessions for each interviewer
    filteredSessions.forEach(session => {
      const interviewerId = session.interviewer_id;
      interviewerCounts[interviewerId] = (interviewerCounts[interviewerId] || 0) + 1;
    });
    
    // Calculate the average number of sessions per interviewer
    const activeInterviewers = Object.values(interviewerCounts).filter(count => count > 0).length;
    const totalSessions = filteredSessions.length;
    const averageSessions = activeInterviewers > 0 ? totalSessions / activeInterviewers : 0;
    const halfAverage = averageSessions / 2;
    
    // Create data for chart - filtering for interviewers with less than half the average
    const underperformingData = Object.entries(interviewerCounts)
      .map(([interviewerId, count]) => {
        const interviewer = interviewers.find(i => i.id === interviewerId);
        return {
          interviewerId,
          code: interviewer ? interviewer.code : "Unknown",
          sessions: count,
          isUnderperforming: count > 0 && count <= halfAverage // Only include active interviewers who underperform
        };
      })
      .filter(item => item.isUnderperforming)
      .sort((a, b) => a.sessions - b.sessions) // Sort ascending (worst first)
      .slice(0, 5); // Limit to top 5 worst
    
    return {
      data: underperformingData,
      averageSessions,
      halfAverage
    };
  }, [sessions, interviewers, dateRange]);
  
  const chartConfig = {
    sessions: {
      label: "Sessions",
      theme: {
        light: "#ef4444",
        dark: "#f87171"
      }
    }
  };
  
  return (
    <Card>
      <CardHeader className="space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CardTitle className="text-lg font-semibold mr-2">
              Underperforming Interviewers – Top 5
            </CardTitle>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <p className="text-sm">
                    Shows interviewers with session counts less than half the average
                    for the selected time period, filtered by your current project and island selection.
                  </p>
                  {chartData.averageSessions > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Current average: {chartData.averageSessions.toFixed(1)} sessions per interviewer.
                      Threshold: {chartData.halfAverage.toFixed(1)} sessions.
                    </p>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-[200px]"
          />
        </div>
        <CardDescription className="mt-2">
          Interviewers with fewer than half the average sessions {dateRange?.from && dateRange?.to && 
            `(${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {loading ? (
          <p className="text-muted-foreground text-center py-10">Loading...</p>
        ) : chartData.data.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No underperforming interviewers found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {chartData.averageSessions > 0 
                ? `All active interviewers have more than ${chartData.halfAverage.toFixed(1)} sessions (half of the average).`
                : "No sessions recorded in the selected date range."}
            </p>
          </div>
        ) : (
          <ChartContainer 
            config={chartConfig} 
            className="h-full w-full"
          >
            <BarChart data={chartData.data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="code" 
                type="category" 
                width={80} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <ReferenceLine 
                x={chartData.halfAverage} 
                stroke="#ff0000" 
                strokeDasharray="3 3"
                label={{ 
                  value: "Half Avg", 
                  position: "insideBottomRight",
                  fill: "#ff0000",
                  fontSize: 10
                }}
              />
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
