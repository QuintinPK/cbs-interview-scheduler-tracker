import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Session, Interview } from "@/types";
import { exportToCSV, calculateDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn, formatDateTime } from "@/lib/utils";
import SessionFilters from "@/components/session/SessionFilters";
import SessionList from "@/components/session/SessionList";
import { useSessions } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Sessions = () => {
  const { toast } = useToast();
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
  
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState({
    latitude: "",
    longitude: "",
  });
  
  const getSessionInterviews = async (sessionId: string): Promise<Interview[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from('interviews')
        .select('*')
        .eq('session_id', sessionId)
        .order('start_time', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error fetching interviews for session:", error);
      toast({
        title: "Error",
        description: "Could not fetch interview data",
        variant: "destructive",
      });
      return [];
    }
  };
  
  const getSessionInterviewsCount = async (sessionId: string): Promise<number> => {
    try {
      const { count, error } = await (supabase as any)
        .from('interviews')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
        
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error("Error fetching interview count for session:", error);
      return 0;
    }
  };
  
  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    
    if (session.end_time) {
      setEditEndDate(new Date(session.end_time));
      setEditEndTime(format(new Date(session.end_time), "HH:mm"));
    } else {
      setEditEndDate(new Date());
      setEditEndTime(format(new Date(), "HH:mm"));
    }
    
    if (session.end_latitude && session.end_longitude) {
      setEditLocation({
        latitude: session.end_latitude.toString(),
        longitude: session.end_longitude.toString(),
      });
    } else {
      setEditLocation({ latitude: "", longitude: "" });
    }
    
    setShowEditDialog(true);
  };
  
  const handleDelete = (session: Session) => {
    setSelectedSession(session);
    setShowDeleteDialog(true);
  };
  
  const handleStopSession = async (session: Session) => {
    await stopSession(session);
  };
  
  const confirmEdit = async () => {
    if (!selectedSession || !editEndDate) return;
    
    try {
      setSubmitting(true);
      
      const [hours, minutes] = editEndTime.split(':').map(Number);
      const endDateTime = new Date(editEndDate);
      endDateTime.setHours(hours, minutes);
      
      const success = await updateSession(selectedSession.id, {
        end_time: endDateTime.toISOString(),
        end_latitude: editLocation.latitude ? parseFloat(editLocation.latitude) : null,
        end_longitude: editLocation.longitude ? parseFloat(editLocation.longitude) : null,
        is_active: false
      });
      
      if (success) {
        setShowEditDialog(false);
      }
    } catch (error) {
      console.error("Error updating session:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedSession) return;
    
    try {
      setSubmitting(true);
      const success = await deleteSession(selectedSession.id);
      
      if (success) {
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleExport = () => {
    const exportData = sessions.map(session => ({
      InterviewerCode: getInterviewerCode(session.interviewer_id),
      StartTime: format(new Date(session.start_time), "dd/MM/yyyy HH:mm"),
      EndTime: session.end_time ? format(new Date(session.end_time), "dd/MM/yyyy HH:mm") : 'Active',
      Duration: session.end_time ? calculateDuration(session.start_time, session.end_time) : 'Ongoing',
      StartLocation: session.start_latitude && session.start_longitude ? 
        `${session.start_latitude.toFixed(4)}, ${session.start_longitude.toFixed(4)}` : 'N/A',
      EndLocation: session.end_latitude && session.end_longitude ? 
        `${session.end_latitude.toFixed(4)}, ${session.end_longitude.toFixed(4)}` : 'N/A',
      Status: session.is_active ? 'Active' : 'Completed'
    }));
    
    exportToCSV(exportData);
    toast({
      title: "Export Started",
      description: "Your sessions data is being downloaded as a CSV file.",
    });
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Session Logs</h1>
          <Button
            onClick={handleExport}
            className="bg-cbs hover:bg-cbs-light flex items-center gap-2"
            disabled={loading}
          >
            <Download size={16} />
            Export to CSV
          </Button>
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
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Interviewer Code</Label>
              <Input 
                value={selectedSession ? getInterviewerCode(selectedSession.interviewer_id) : ""} 
                disabled 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Start Date/Time</Label>
              <Input 
                value={selectedSession ? formatDateTime(selectedSession.start_time) : ""} 
                disabled 
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editEndDate && "text-muted-foreground"
                    )}
                    disabled={submitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editEndDate ? format(editEndDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={editEndDate}
                    onSelect={setEditEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                disabled={submitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Location (Latitude, Longitude)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Latitude"
                  value={editLocation.latitude}
                  onChange={(e) => setEditLocation({ ...editLocation, latitude: e.target.value })}
                  disabled={submitting}
                />
                <Input
                  placeholder="Longitude"
                  value={editLocation.longitude}
                  onChange={(e) => setEditLocation({ ...editLocation, longitude: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmEdit} 
              className="bg-cbs hover:bg-cbs-light"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this session for {selectedSession ? getInterviewerCode(selectedSession.interviewer_id) : ''}?</p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Sessions;
