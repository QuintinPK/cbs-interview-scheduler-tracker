
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { InterviewerHeader } from "@/components/interviewer-dashboard/InterviewerHeader";
import { InterviewerQuickStats } from "@/components/interviewer-dashboard/InterviewerQuickStats";
import { ContactInformation } from "@/components/interviewer-dashboard/ContactInformation";
import { ActivitySummary } from "@/components/interviewer-dashboard/ActivitySummary";
import { SessionHistory } from "@/components/interviewer-dashboard/SessionHistory";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useInterviewerMetrics } from "@/hooks/useInterviewerMetrics";
import { useInterviewerSessions } from "@/hooks/useInterviewerSessions";
import { useInterviewerWorkHours } from "@/hooks/useInterviewerWorkHours";
import { Interviewer, Session } from "@/types";
import { format } from "date-fns";

const InterviewerDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const [interviewer, setInterviewer] = useState<Interviewer | null>(null);
  const [startDate, setStartDate] = useState<string>(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  // Use hooks to fetch data related to this interviewer
  const { 
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth,
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime,
    sessions
  } = useInterviewerMetrics(id);
  
  const sessionsData = sessions || [];
  const activeSessions = sessionsData.filter(session => session.is_active);
  
  // Only pass the interviewer code to the hook, as that's all it expects
  const { totalActiveTime, totalActiveSeconds } = useInterviewerWorkHours(interviewer?.code);
  
  useEffect(() => {
    if (interviewers.length > 0 && id) {
      const found = interviewers.find(i => i.id === id);
      
      if (found) {
        setInterviewer(found);
      } else {
        // Interviewer not found, redirect to interviewers list
        navigate('/admin/interviewers');
      }
    }
  }, [interviewers, id, navigate]);
  
  if (interviewersLoading || !interviewer) {
    return (
      <AdminLayout>
        <div className="p-4 flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/interviewers')}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>Loading interviewer data...</div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/interviewers')}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          
          <InterviewerHeader 
            interviewer={interviewer} 
            loading={false}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <InterviewerQuickStats 
              interviewer={interviewer}
              totalTime={totalActiveTime}
              hasActiveSessions={activeSessions.length > 0}
            />
            
            <ActivitySummary 
              sessions={sessionsData} 
              daysSinceLastActive={daysSinceLastActive || 0}
              avgDaysPerWeek={avgDaysPerWeek}
              daysWorkedInMonth={daysWorkedInMonth}
              sessionsInPlanTime={sessionsInPlanTime}
              avgSessionDuration={avgSessionDuration}
              earliestStartTime={earliestStartTime ? new Date(earliestStartTime) : null}
              latestEndTime={latestEndTime ? new Date(latestEndTime) : null}
              activeSessions={activeSessions}
            />
            
            <SessionHistory 
              sessions={sessionsData} 
              dateRange={undefined}
              setDateRange={() => {}}
            />
          </div>
          
          <div className="space-y-6">
            <ContactInformation 
              interviewer={interviewer} 
            />
            
            {/* Additional cards can be added here */}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default InterviewerDashboard;
