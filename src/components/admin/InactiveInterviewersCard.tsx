
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import { UserX } from "lucide-react";
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { addDays, startOfDay, endOfDay } from "date-fns";

interface InactiveInterviewersCardProps {
  sessions: Session[];
  interviewers: Interviewer[];
  loading?: boolean;
}

const InactiveInterviewersCard: React.FC<InactiveInterviewersCardProps> = ({
  sessions,
  interviewers,
  loading = false
}) => {
  // Default date range (current week)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(addDays(new Date(), -new Date().getDay())), // Start of current week (Sunday)
    to: endOfDay(new Date()) // Today
  });
  
  // Find inactive interviewer IDs within the selected date range
  const inactiveInterviewers = useMemo(() => {
    // Calculate start date for filtering (default to start of week if not selected)
    const startDate = dateRange?.from ? startOfDay(dateRange.from) : 
      startOfDay(addDays(new Date(), -new Date().getDay()));
    
    // Calculate end date for filtering (default to today if not selected)
    const endDate = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date());
    
    // Find active interviewer IDs within the date range
    const activeInterviewerIds = new Set(
      sessions
        .filter(session => {
          const sessionDate = new Date(session.start_time);
          return sessionDate >= startDate && sessionDate <= endDate;
        })
        .map(session => session.interviewer_id)
    );
    
    // Get interviewers who haven't been active in the selected date range
    return interviewers.filter(
      interviewer => !activeInterviewerIds.has(interviewer.id)
    );
  }, [sessions, interviewers, dateRange]);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex items-center">
            <UserX className="h-5 w-5 mr-2 text-amber-500" />
            <span>Interviewers Inactive</span>
          </CardTitle>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : inactiveInterviewers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">All interviewers have been active in the selected period</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inactiveInterviewers.map((interviewer) => (
              <Link 
                key={interviewer.id} 
                to={`/admin/interviewer/${interviewer.id}`}
                className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <p className="font-medium">{interviewer.code}</p>
                <p className="text-sm text-muted-foreground">
                  {interviewer.first_name} {interviewer.last_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {interviewer.email}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InactiveInterviewersCard;
