
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useSessions } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import SessionFilters from "@/components/session/SessionFilters";
import SessionList from "@/components/session/SessionList";
import SessionEditDialog from "@/components/session/SessionEditDialog";
import SessionDeleteDialog from "@/components/session/SessionDeleteDialog";
import SessionExport from "@/components/session/SessionExport";
import useSessionDialogs from "@/hooks/useSessionDialogs";
import useInterviewsData from "@/hooks/useInterviewsData";

const Sessions = () => {
  const { projects } = useProjects();
  const { 
    sessions, 
    loading, 
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    getInterviewerCode,
    applyFilters,
    resetFilters,
    stopSession,
    updateSession,
    deleteSession
  } = useSessions();
  
  const {
    selectedSession,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    submitting,
    editEndDate,
    setEditEndDate,
    editEndTime,
    setEditEndTime,
    editLocation,
    setEditLocation,
    handleEdit,
    handleDelete,
    confirmEdit,
    confirmDelete
  } = useSessionDialogs();

  const {
    getSessionInterviews,
    getSessionInterviewsCount
  } = useInterviewsData();
  
  const handleStopSession = async (session: any) => {
    await stopSession(session);
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Session Logs</h1>
          <SessionExport 
            sessions={sessions}
            getInterviewerCode={getInterviewerCode}
            loading={loading}
          />
        </div>
        
        <SessionFilters
          interviewerCodeFilter={interviewerCodeFilter}
          setInterviewerCodeFilter={setInterviewerCodeFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
          loading={loading}
        />
        
        <SessionList
          sessions={sessions}
          loading={loading}
          getInterviewerCode={getInterviewerCode}
          getSessionInterviews={getSessionInterviews}
          getSessionInterviewsCount={getSessionInterviewsCount}
          onEdit={handleEdit}
          onStop={handleStopSession}
          onDelete={handleDelete}
          projects={projects}
        />
      </div>
      
      <SessionEditDialog
        showDialog={showEditDialog}
        setShowDialog={setShowEditDialog}
        selectedSession={selectedSession}
        editEndDate={editEndDate}
        setEditEndDate={setEditEndDate}
        editEndTime={editEndTime}
        setEditEndTime={setEditEndTime}
        editLocation={editLocation}
        setEditLocation={setEditLocation}
        submitting={submitting}
        confirmEdit={confirmEdit}
        getInterviewerCode={getInterviewerCode}
      />
      
      <SessionDeleteDialog
        showDialog={showDeleteDialog}
        setShowDialog={setShowDeleteDialog}
        selectedSession={selectedSession}
        submitting={submitting}
        confirmDelete={confirmDelete}
        getInterviewerCode={getInterviewerCode}
      />
    </AdminLayout>
  );
};

export default Sessions;
