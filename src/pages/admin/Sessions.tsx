import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/types";

import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSessions } from "@/hooks/useSessions";
import SessionList from "@/components/session/SessionList";
import InterviewsList from "@/components/session/InterviewsList";
import SessionFilters from "@/components/session/SessionFilters";
import { SessionTotals } from "@/components/session/SessionTotals";
import { useFilter } from "@/contexts/FilterContext";

const Sessions = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { toast } = useToast();
  
  // Use our sessions hook
  const {
    sessions,
    loading,
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    applyFilters,
    resetFilters,
    stopSession,
    updateSession,
    deleteSession
  } = useSessions();
  
  // Get projects and filters from the global filter context
  const { selectedProject, selectedIsland } = useFilter();
  
  // Filter labels to display
  const filterLabels = [];
  if (selectedProject) {
    filterLabels.push(`Project: ${selectedProject.name}`);
  }
  if (selectedIsland) {
    filterLabels.push(`Island: ${selectedIsland}`);
  }
  
  // Stats calculations
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.is_active).length;
  
  // Calculate interviews stats
  const countInterviewsByResult = (result: "completed" | "not_home" | "refused" | null) => {
    let count = 0;
    sessions.forEach(session => {
      if (!session.interviews) return;
      session.interviews.forEach(interview => {
        if (interview.result === result) count++;
      });
    });
    return count;
  };
  
  // Interview stats
  const completedInterviews = countInterviewsByResult("completed");
  const refusedInterviews = countInterviewsByResult("refused");
  const notHomeInterviews = countInterviewsByResult("not_home");
  
  // Display active tabs based on data availability
  const hasInterviews = sessions.some(session => session.interviews && session.interviews.length > 0);
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Session Logs</h1>
            <div className="text-muted-foreground flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                View and manage all session recordings
              </span>
            </div>
          </div>
          
          {/* Remove duplicate GlobalFilter here, keeping only the one in AdminLayout */}
        </div>
        
        {/* Display applied filters */}
        {filterLabels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filterLabels.map((label, idx) => (
              <Badge key={idx} variant="outline">{label}</Badge>
            ))}
          </div>
        )}
        
        {/* Session stats */}
        <SessionTotals
          totalSessions={totalSessions}
          activeSessions={activeSessions}
          completedInterviews={completedInterviews}
          refusedInterviews={refusedInterviews}
          notHomeInterviews={notHomeInterviews}
        />
        
        {/* Session filters */}
        <SessionFilters
          interviewerCodeFilter={interviewerCodeFilter}
          setInterviewerCodeFilter={setInterviewerCodeFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
        />
        
        {/* Tabs for sessions and interviews */}
        <div>
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium ${activeTabIndex === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTabIndex(0)}
            >
              Sessions
            </button>
            {hasInterviews && (
              <button
                className={`px-4 py-2 font-medium ${activeTabIndex === 1 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTabIndex(1)}
              >
                Interviews
              </button>
            )}
          </div>
          
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
                <h3 className="text-lg font-medium mb-2">No Sessions Found</h3>
                <p className="text-muted-foreground mb-4">
                  There are no sessions matching your current filters.
                </p>
                <Button onClick={resetFilters}>Reset Filters</Button>
              </div>
            ) : activeTabIndex === 0 ? (
              <SessionList 
                sessions={sessions}
                onStopSession={stopSession}
                onDeleteSession={deleteSession}
              />
            ) : (
              <InterviewsList sessions={sessions} />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Sessions;
