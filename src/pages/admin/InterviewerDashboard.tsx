
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { InterviewerHeader } from "@/components/interviewer-dashboard/InterviewerHeader";
import { ContactInformation } from "@/components/interviewer-dashboard/ContactInformation";
import { InterviewerQuickStats } from "@/components/interviewer-dashboard/InterviewerQuickStats";
import { SessionHistory } from "@/components/interviewer-dashboard/SessionHistory";
import { ActivitySummary } from "@/components/interviewer-dashboard/ActivitySummary";
import { PerformanceMetrics } from "@/components/interviewer-dashboard/PerformanceMetrics";
import { DateRangePicker } from "@/components/ui/date-range-picker"; 
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSessions } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { useInterviewerSessions } from "@/hooks/useInterviewerSessions";
import { useInterviewerMetrics } from "@/hooks/useInterviewerMetrics";
import EvaluationsCard from "@/components/interviewer/EvaluationsCard";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

const InterviewerDashboard = () => {
  const navigate = useNavigate();
  const { interviewerId } = useParams<{ interviewerId: string }>();

  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const { getInterviewerSessions, getInterviewerInterviews } = useSessions();
  const { getProjectName } = useProjects();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date()
  });

  const [interviewer, setInterviewer] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load interviewer data
  useEffect(() => {
    if (!interviewerId || interviewersLoading) return;
    
    const findInterviewer = interviewers.find(i => i.id === interviewerId);
    if (findInterviewer) {
      setInterviewer(findInterviewer);
    } else {
      navigate("/admin/interviewers", { replace: true });
    }
  }, [interviewerId, interviewers, interviewersLoading, navigate]);

  // Load sessions and interviews data based on date range
  useEffect(() => {
    const fetchData = async () => {
      if (!interviewerId || !dateRange.from || !dateRange.to) return;
      
      setLoading(true);
      try {
        // Format dates for API
        const fromStr = format(dateRange.from, "yyyy-MM-dd");
        const toStr = format(new Date(dateRange.to.setHours(23, 59, 59)), "yyyy-MM-dd'T'HH:mm:ss");
        
        // Fetch sessions
        const sessionsData = await getInterviewerSessions(interviewerId, fromStr, toStr);
        setSessions(sessionsData);
        
        // Fetch interviews
        const interviewsData = await getInterviewerInterviews(interviewerId, fromStr, toStr);
        setInterviews(interviewsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [interviewerId, dateRange, getInterviewerSessions, getInterviewerInterviews]);

  // Calculate metrics
  const { 
    sessionsInPlanTime, 
    avgSessionDuration, 
    earliestStartTime, 
    latestEndTime 
  } = useInterviewerSessions(sessions);

  const {
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth,
    responseRate,
    nonResponseRate,
    avgInterviewsPerSession
  } = useInterviewerMetrics(sessions, interviews);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <InterviewerHeader 
          interviewer={interviewer} 
          loading={loading || interviewersLoading} 
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-muted-foreground">
            Filter data by date range:
          </div>
          <DateRangePicker
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InterviewerQuickStats 
              loading={loading}
              sessions={sessions.length}
              interviews={interviews.length}
              responseRate={responseRate}
              nonResponseRate={nonResponseRate}
            />

            <SessionHistory 
              sessions={sessions}
              interviews={interviews}
              dateRange={dateRange}
              setDateRange={setDateRange}
              showProject={true}
              projectNameResolver={getProjectName}
            />
          </div>

          <div className="space-y-6">
            <ContactInformation 
              interviewer={interviewer} 
              loading={loading || interviewersLoading} 
            />

            <ActivitySummary 
              sessions={sessions}
              sessionsInPlanTime={sessionsInPlanTime}
              avgSessionDuration={avgSessionDuration}
              earliestStartTime={earliestStartTime}
              latestEndTime={latestEndTime}
              loading={loading}
            />
            
            <PerformanceMetrics
              daysSinceLastActive={daysSinceLastActive}
              avgDaysPerWeek={avgDaysPerWeek}
              daysWorkedInMonth={daysWorkedInMonth}
              responseRate={responseRate}
              nonResponseRate={nonResponseRate}
              avgInterviewsPerSession={avgInterviewsPerSession}
              loading={loading}
              interviewerId={interviewerId}
              interviewer={interviewer}
            />

            {interviewer && (
              <EvaluationsCard
                interviewer={interviewer}
                projectNameResolver={getProjectName}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default InterviewerDashboard;
