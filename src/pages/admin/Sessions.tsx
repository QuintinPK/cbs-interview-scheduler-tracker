import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Session, Interviewer } from "@/types";
import { 
  formatDateTime, 
  calculateDuration,
  exportToCSV 
} from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, Pencil, StopCircle, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Sessions = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  
  // Filter states
  const [interviewerCodeFilter, setInterviewerCodeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  
  // Edit states
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState({
    latitude: "",
    longitude: "",
  });
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load interviewers first
        const { data: interviewersData, error: interviewersError } = await supabase
          .from('interviewers')
          .select('*');
          
        if (interviewersError) throw interviewersError;
        setInterviewers(interviewersData || []);
        
        // Then load sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .order('start_time', { ascending: false });
          
        if (sessionsError) throw sessionsError;
        
        const transformedSessions = sessionsData.map(session => ({
          ...session,
          start_latitude: session.start_latitude !== null ? Number(session.start_latitude) : null,
          start_longitude: session.start_longitude !== null ? Number(session.start_longitude) : null,
          end_latitude: session.end_latitude !== null ? Number(session.end_latitude) : null,
          end_longitude: session.end_longitude !== null ? Number(session.end_longitude) : null,
        }));
        
        setSessions(transformedSessions);
        setFilteredSessions(transformedSessions);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Could not load sessions data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast]);
  
  const getInterviewerCode = (interviewerId: string) => {
    const interviewer = interviewers.find(i => i.id === interviewerId);
    return interviewer ? interviewer.code : 'Unknown';
  };
  
  const applyFilters = () => {
    let filtered = [...sessions];
    
    if (interviewerCodeFilter) {
      const matchingInterviewers = interviewers.filter(interviewer => 
        interviewer.code.toLowerCase().includes(interviewerCodeFilter.toLowerCase())
      );
      
      if (matchingInterviewers.length > 0) {
        const interviewerIds = matchingInterviewers.map(i => i.id);
        filtered = filtered.filter(session => interviewerIds.includes(session.interviewer_id));
      } else {
        filtered = [];
      }
    }
    
    if (dateFilter) {
      const filterDate = dateFilter.toISOString().split('T')[0];
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
        return sessionDate === filterDate;
      });
    }
    
    setFilteredSessions(filtered);
  };
  
  const resetFilters = () => {
    setInterviewerCodeFilter("");
    setDateFilter(undefined);
    setFilteredSessions(sessions);
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
    try {
      setLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: new Date().toISOString(),
          end_latitude: currentLocation?.latitude || null,
          end_longitude: currentLocation?.longitude || null,
          end_address: currentLocation?.address || null,
          is_active: false
        })
        .eq('id', session.id);
        
      if (error) throw error;
      
      const { data: updatedSessions, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      const transformedSessions = updatedSessions.map(s => ({
        ...s,
        start_latitude: s.start_latitude !== null ? Number(s.start_latitude) : null,
        start_longitude: s.start_longitude !== null ? Number(s.start_longitude) : null,
        end_latitude: s.end_latitude !== null ? Number(s.end_latitude) : null,
        end_longitude: s.end_longitude !== null ? Number(s.end_longitude) : null,
      }));
      
      setSessions(transformedSessions);
      applyFilters();
      
      toast({
        title: "Session Stopped",
        description: `Session for ${getInterviewerCode(session.interviewer_id)} has been stopped.`,
      });
    } catch (error) {
      console.error("Error stopping session:", error);
      toast({
        title: "Error",
        description: "Could not stop session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const confirmEdit = async () => {
    if (!selectedSession || !editEndDate) return;
    
    try {
      setLoading(true);
      
      const [hours, minutes] = editEndTime.split(':').map(Number);
      const endDateTime = new Date(editEndDate);
      endDateTime.setHours(hours, minutes);
      
      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: endDateTime.toISOString(),
          end_latitude: editLocation.latitude ? parseFloat(editLocation.latitude) : null,
          end_longitude: editLocation.longitude ? parseFloat(editLocation.longitude) : null,
          is_active: false
        })
        .eq('id', selectedSession.id);
        
      if (error) throw error;
      
      const { data: updatedSessions, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      const transformedSessions = updatedSessions.map(s => ({
        ...s,
        start_latitude: s.start_latitude !== null ? Number(s.start_latitude) : null,
        start_longitude: s.start_longitude !== null ? Number(s.start_longitude) : null,
        end_latitude: s.end_latitude !== null ? Number(s.end_latitude) : null,
        end_longitude: s.end_longitude !== null ? Number(s.end_longitude) : null,
      }));
      
      setSessions(transformedSessions);
      applyFilters();
      
      setShowEditDialog(false);
      toast({
        title: "Session Updated",
        description: `Session for ${getInterviewerCode(selectedSession.interviewer_id)} has been updated.`,
      });
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description: "Could not update session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedSession) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', selectedSession.id);
        
      if (error) throw error;
      
      const updatedSessions = sessions.filter(s => s.id !== selectedSession.id);
      setSessions(updatedSessions);
      setFilteredSessions(filteredSessions.filter(s => s.id !== selectedSession.id));
      
      setShowDeleteDialog(false);
      toast({
        title: "Session Deleted",
        description: `Session for ${getInterviewerCode(selectedSession.interviewer_id)} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Could not delete session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = () => {
    const exportData = filteredSessions.map(session => ({
      InterviewerCode: getInterviewerCode(session.interviewer_id),
      StartTime: formatDateTime(session.start_time),
      EndTime: session.end_time ? formatDateTime(session.end_time) : 'Active',
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
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h2 className="font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="interviewer-filter">Interviewer Code</Label>
              <Input
                id="interviewer-filter"
                placeholder="Filter by interviewer code"
                value={interviewerCodeFilter}
                onChange={(e) => setInterviewerCodeFilter(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFilter && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                onClick={applyFilters} 
                className="bg-cbs hover:bg-cbs-light"
                disabled={loading}
              >
                Apply Filters
              </Button>
              <Button 
                onClick={resetFilters} 
                variant="outline"
                disabled={loading}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
        
        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interviewer Code</TableHead>
                  <TableHead>Start Date/Time</TableHead>
                  <TableHead>End Date/Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Start Location</TableHead>
                  <TableHead>End Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-cbs" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{getInterviewerCode(session.interviewer_id)}</TableCell>
                      <TableCell>{formatDateTime(session.start_time)}</TableCell>
                      <TableCell>
                        {session.end_time ? formatDateTime(session.end_time) : (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.end_time ? calculateDuration(session.start_time, session.end_time) : "Ongoing"}
                      </TableCell>
                      <TableCell>
                        {session.start_latitude && session.start_longitude ? (
                          <span className="text-xs">
                            {session.start_latitude.toFixed(4)}, {session.start_longitude.toFixed(4)}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {session.end_latitude && session.end_longitude ? (
                          <span className="text-xs">
                            {session.end_latitude.toFixed(4)}, {session.end_longitude.toFixed(4)}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(session)}
                            title="Edit"
                            disabled={loading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          {session.is_active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStopSession(session)}
                              title="Stop Session"
                              disabled={loading}
                            >
                              <StopCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(session)}
                            title="Delete"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Edit Dialog */}
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
                    disabled={loading}
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
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Location (Latitude, Longitude)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Latitude"
                  value={editLocation.latitude}
                  onChange={(e) => setEditLocation({ ...editLocation, latitude: e.target.value })}
                  disabled={loading}
                />
                <Input
                  placeholder="Longitude"
                  value={editLocation.longitude}
                  onChange={(e) => setEditLocation({ ...editLocation, longitude: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmEdit} 
              className="bg-cbs hover:bg-cbs-light"
              disabled={loading}
            >
              {loading ? (
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
      
      {/* Delete Confirmation Dialog */}
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? (
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
