
import React from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import GlobalFilter from "@/components/GlobalFilter";
import { useSessions } from "@/hooks/useSessions";
import SessionList from "@/components/session/SessionList";
import SessionFilters from "@/components/session/SessionFilters";
import { useFilter } from "@/contexts/FilterContext";

const Sessions = () => {
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
    deleteSession,
    getInterviewerCode
  } = useSessions();
  
  // Get projects and filters from the global filter context
  const { selectedProject, selectedIsland } = useFilter();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h2 className="font-semibold mb-4">Global Filters</h2>
          <GlobalFilter />
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Session Logs</h1>
          <Button variant="outline">
            Export to CSV
          </Button>
        </div>
        
        {/* Session filters */}
        <SessionFilters
          interviewerCodeFilter={interviewerCodeFilter}
          setInterviewerCodeFilter={setInterviewerCodeFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
          loading={loading}
        />
        
        <div>
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
          ) : (
            <SessionList 
              sessions={sessions}
              onDeleteSession={deleteSession}
              onStopSession={stopSession}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Sessions;
