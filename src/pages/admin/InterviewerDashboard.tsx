
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DateRange } from "react-day-picker";
import AdminLayout from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { supabase } from "@/integrations/supabase/client";
import { Session, Interviewer } from "@/types";
import { useInterviewerMetrics } from "@/hooks/useInterviewerMetrics";
import { useSchedules } from "@/hooks/useSchedules";

// Importing our new components
import { InterviewerHeader } from "@/components/interviewer-dashboard/InterviewerHeader";
import { InterviewerQuickStats } from "@/components/interviewer-dashboard/InterviewerQuickStats";
import { ActivitySummary } from "@/components/interviewer-dashboard/ActivitySummary";
import { SessionHistory } from "@/components/interviewer-dashboard/SessionHistory";
import { ContactInformation } from "@/components/interviewer-dashboard/ContactInformation";

const InterviewerDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [interviewer, setInterviewer] = useState<Interviewer | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  
  // Use our custom metrics hook
  const metrics = useInterviewerMetrics(id, sessions);
  const { schedules } = useSchedules(id);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch interviewer data
        const { data: interviewerData, error: interviewerError } = await supabase
          .from('interviewers')
          .select('*')
          .eq('id', id)
          .single();
          
        if (interviewerError) throw interviewerError;
        
        // Properly map the database result to our Interviewer type
        const typedInterviewer: Interviewer = {
          id: interviewerData.id,
          code: interviewerData.code,
          first_name: interviewerData.first_name,
          last_name: interviewerData.last_name,
          phone: interviewerData.phone || "",
          email: interviewerData.email || "",
          island: (interviewerData.island as 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined)
        };
        
        setInterviewer(typedInterviewer);
        
        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', id)
          .order('start_time', { ascending: false });
          
        if (sessionsError) throw sessionsError;
        
        const transformedSessions = sessionsData.map(session => ({
          ...session,
          start_latitude: session.start_latitude !== null ? Number(session.start_latitude) : null,
          start_longitude: session.start_longitude !== null ? Number(session.start_longitude) : null,
          end_latitude: session.end_latitude !== null ? Number(session.end_latitude) : null,
          end_longitude: session.end_longitude !== null ? Number(session.end_longitude) : null,
        }));
        
        setSessions(transformedSessions || []);
        setFilteredSessions(transformedSessions || []);
      } catch (error) {
        console.error("Error fetching interviewer data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Apply date filter to sessions
  useEffect(() => {
    if (!dateRange || !dateRange.from) {
      setFilteredSessions(sessions);
      return;
    }
    
    let filtered = [...sessions];
    
    const fromDate = new Date(dateRange.from);
    const toDate = dateRange.to ? new Date(dateRange.to) : fromDate;
    
    // Set time to start of day for from date and end of day for to date
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    
    filtered = filtered.filter(session => {
      const sessionDate = new Date(session.start_time);
      return sessionDate >= fromDate && sessionDate <= toDate;
    });
    
    setFilteredSessions(filtered);
  }, [dateRange, sessions]);
  
  // Calculate total active time
  const calculateTotalTime = () => {
    if (!sessions.length) return "0h 0m";
    
    let totalMinutes = 0;
    
    sessions.forEach(session => {
      if (session.start_time && session.end_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    
    return `${hours}h ${minutes}m`;
  };
  
  // Active sessions
  const activeSessions = sessions.filter(session => session.is_active);
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <InterviewerHeader 
          interviewer={interviewer} 
          loading={loading} 
        />
        
        {interviewer && (
          <InterviewerQuickStats
            interviewer={interviewer}
            totalTime={calculateTotalTime()}
            hasActiveSessions={activeSessions.length > 0}
          />
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="contact">Contact Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 pt-4">
            <ActivitySummary
              sessions={sessions}
              daysSinceLastActive={metrics.daysSinceLastActive}
              avgDaysPerWeek={metrics.avgDaysPerWeek}
              daysWorkedInMonth={metrics.daysWorkedInMonth}
              sessionsInPlanTime={metrics.sessionsInPlanTime}
              avgSessionDuration={metrics.avgSessionDuration}
              earliestStartTime={metrics.earliestStartTime}
              latestEndTime={metrics.latestEndTime}
              activeSessions={activeSessions}
            />
          </TabsContent>
          
          <TabsContent value="sessions" className="pt-4">
            <SessionHistory
              sessions={filteredSessions}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </TabsContent>
          
          <TabsContent value="contact" className="pt-4">
            <ContactInformation interviewer={interviewer} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default InterviewerDashboard;
