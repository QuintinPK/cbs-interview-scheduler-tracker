
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { InterviewerHeader } from "@/components/interviewer-dashboard/InterviewerHeader";
import { ContactInformation } from "@/components/interviewer-dashboard/ContactInformation";
import { InterviewerQuickStats } from "@/components/interviewer-dashboard/InterviewerQuickStats";
import SessionHistory from "@/components/interviewer-dashboard/SessionHistory";
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
import { supabase } from "@/integrations/supabase/client";

const InterviewerDashboard = () => {
  const navigate = useNavigate();
  const { interviewerId } = useParams<{ interviewerId: string }>();

  const { interviewers, loading: interviewersLoading, refresh: refreshInterviewers } = useInterviewers();
  const { sessions: allSessions } = useSessions();
  const { projects } = useProjects();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date()
  });

  const [interviewer, setInterviewer] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug the interviewerId parameter
  console.log("InterviewerDashboard - interviewerId from params:", interviewerId);

  // Load interviewer data - ensure it runs if interviewerId changes
  useEffect(() => {
    const fetchInterviewer = async () => {
      console.log("Attempting to fetch interviewer with ID:", interviewerId);
      
      if (!interviewerId) {
        console.error("No interviewerId provided in URL parameters");
        navigate("/admin/interviewers", { replace: true });
        return;
      }
      
      setLoading(true);
      
      try {
        // First try to find the interviewer in the already loaded interviewers
        if (!interviewersLoading && interviewers.length > 0) {
          console.log("Searching in loaded interviewers array:", interviewers.length, "interviewers");
          const foundInterviewer = interviewers.find(i => i.id === interviewerId);
          
          if (foundInterviewer) {
            console.log("Found interviewer in loaded interviewers:", foundInterviewer);
            setInterviewer(foundInterviewer);
            setLoading(false);
            return;
          } else {
            console.log("Interviewer not found in loaded interviewers, trying direct fetch");
          }
        }
        
        // If not found or interviewers not loaded yet, fetch directly from Supabase
        console.log("Fetching interviewer directly from Supabase");
        const { data, error } = await supabase
          .from('interviewers')
          .select('*')
          .eq('id', interviewerId)
          .single();
          
        if (error) {
          console.error("Error fetching interviewer from Supabase:", error);
          navigate("/admin/interviewers", { replace: true });
          return;
        }
        
        if (!data) {
          console.error("Interviewer not found in database");
          navigate("/admin/interviewers", { replace: true });
          return;
        }
        
        console.log("Successfully fetched interviewer from Supabase:", data);
        setInterviewer(data);
      } catch (error) {
        console.error("Error in fetchInterviewer:", error);
        navigate("/admin/interviewers", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterviewer();
  }, [interviewerId, interviewers, interviewersLoading, navigate]);

  // Load sessions and interviews data based on date range
  useEffect(() => {
    const fetchData = async () => {
      if (!interviewerId || !dateRange.from || !dateRange.to) return;
      
      setLoading(true);
      try {
        // Format dates for filtering
        const fromDate = dateRange.from;
        const toDate = new Date(dateRange.to.getTime());
        toDate.setHours(23, 59, 59, 999);
        
        // Filter sessions by interviewer and date range
        const filteredSessions = allSessions.filter(session => 
          session.interviewer_id === interviewerId &&
          new Date(session.start_time) >= fromDate &&
          new Date(session.start_time) <= toDate
        );
        setSessions(filteredSessions);
        
        // Fetch interviews based on session IDs
        try {
          // Check if we have any sessions before trying to fetch interviews
          if (filteredSessions.length === 0) {
            setInterviews([]);
            setLoading(false);
            return;
          }
          
          const sessionIds = filteredSessions.map(s => String(s.id));
          
          // Fix the type error by explicitly casting the sessionIds array to string[]
          const { data: interviewsData, error } = await supabase
            .from('interviews')
            .select('*')
            .in('session_id', sessionIds as string[]);
            
          if (error) throw error;
          setInterviews(interviewsData || []);
        } catch (error) {
          console.error("Error fetching interviews:", error);
          setInterviews([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [interviewerId, dateRange, allSessions]);

  // Get project name resolver function
  const getProjectName = (projectId: string | null | undefined) => {
    if (!projectId) return "No project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown project";
  };

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
    daysWorkedInMonth
  } = useInterviewerMetrics(interviewerId, sessions);

  // Calculate additional metrics
  const responseCount = interviews.filter(i => i.result === 'response').length;
  const responseRate = interviews.length > 0 ? (responseCount / interviews.length) * 100 : 0;
  const nonResponseRate = interviews.length > 0 ? 100 - responseRate : 0;
  const avgInterviewsPerSession = sessions.length > 0 ? interviews.length / sessions.length : 0;
  
  // Check for active sessions
  const activeSessions = sessions.filter(s => s.is_active);
  const hasActiveSessions = activeSessions.length > 0;
  
  // Calculate total time
  const totalMinutes = sessions.reduce((total, session) => {
    if (session.end_time) {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      return total + ((end.getTime() - start.getTime()) / (1000 * 60));
    }
    return total;
  }, 0);
  
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.round(totalMinutes % 60);
  const totalTime = `${totalHours}h ${remainingMinutes}m`;

  // For debugging purposes
  useEffect(() => {
    console.log("Current interviewerId from params:", interviewerId);
    console.log("Loaded interviewer data:", interviewer);
  }, [interviewerId, interviewer]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <InterviewerHeader 
          interviewer={interviewer}
          loading={loading}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-muted-foreground">
            Filter data by date range:
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InterviewerQuickStats 
              interviewer={interviewer}
              totalTime={totalTime}
              hasActiveSessions={hasActiveSessions}
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
            />

            <ActivitySummary 
              sessions={sessions}
              daysSinceLastActive={daysSinceLastActive}
              avgDaysPerWeek={avgDaysPerWeek}
              daysWorkedInMonth={daysWorkedInMonth}
              sessionsInPlanTime={sessionsInPlanTime}
              avgSessionDuration={avgSessionDuration}
              earliestStartTime={earliestStartTime}
              latestEndTime={latestEndTime}
              activeSessions={activeSessions}
            />
            
            <PerformanceMetrics
              sessions={sessions}
              interviews={interviews}
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
