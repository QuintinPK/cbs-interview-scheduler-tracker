
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { mockSessions } from "@/lib/mock-data";
import { Session } from "@/types";
import { 
  formatDateTime, 
  calculateDuration,
  exportToCSV 
} from "@/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, Pencil, StopCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Sessions = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>(mockSessions);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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
  
  const applyFilters = () => {
    let filtered = [...sessions];
    
    if (interviewerCodeFilter) {
      filtered = filtered.filter(session => 
        session.interviewerCode.toLowerCase().includes(interviewerCodeFilter.toLowerCase())
      );
    }
    
    if (dateFilter) {
      const filterDate = dateFilter.toISOString().split('T')[0];
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
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
    
    if (session.endTime) {
      setEditEndDate(new Date(session.endTime));
      setEditEndTime(format(new Date(session.endTime), "HH:mm"));
    } else {
      setEditEndDate(new Date());
      setEditEndTime(format(new Date(), "HH:mm"));
    }
    
    if (session.endLocation) {
      setEditLocation({
        latitude: session.endLocation.latitude.toString(),
        longitude: session.endLocation.longitude.toString(),
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
  
  const handleStopSession = (session: Session) => {
    const updatedSessions = sessions.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          endTime: new Date().toISOString(),
          isActive: false,
        };
      }
      return s;
    });
    
    setSessions(updatedSessions);
    setFilteredSessions(
      filteredSessions.map(s => {
        if (s.id === session.id) {
          return {
            ...s,
            endTime: new Date().toISOString(),
            isActive: false,
          };
        }
        return s;
      })
    );
    
    toast({
      title: "Session Stopped",
      description: `Session for ${session.interviewerCode} has been stopped.`,
    });
  };
  
  const confirmEdit = () => {
    if (!selectedSession || !editEndDate) return;
    
    // Combine date and time
    const [hours, minutes] = editEndTime.split(':').map(Number);
    const endDateTime = new Date(editEndDate);
    endDateTime.setHours(hours, minutes);
    
    // Update session
    const updatedSessions = sessions.map(session => {
      if (session.id === selectedSession.id) {
        return {
          ...session,
          endTime: endDateTime.toISOString(),
          endLocation: editLocation.latitude && editLocation.longitude
            ? {
                latitude: parseFloat(editLocation.latitude),
                longitude: parseFloat(editLocation.longitude),
              }
            : undefined,
          isActive: false,
        };
      }
      return session;
    });
    
    setSessions(updatedSessions);
    setFilteredSessions(
      filteredSessions.map(session => {
        if (session.id === selectedSession.id) {
          return {
            ...session,
            endTime: endDateTime.toISOString(),
            endLocation: editLocation.latitude && editLocation.longitude
              ? {
                  latitude: parseFloat(editLocation.latitude),
                  longitude: parseFloat(editLocation.longitude),
                }
              : undefined,
            isActive: false,
          };
        }
        return session;
      })
    );
    
    setShowEditDialog(false);
    toast({
      title: "Session Updated",
      description: `Session for ${selectedSession.interviewerCode} has been updated.`,
    });
  };
  
  const confirmDelete = () => {
    if (!selectedSession) return;
    
    const updatedSessions = sessions.filter(session => session.id !== selectedSession.id);
    const updatedFilteredSessions = filteredSessions.filter(session => session.id !== selectedSession.id);
    
    setSessions(updatedSessions);
    setFilteredSessions(updatedFilteredSessions);
    
    setShowDeleteDialog(false);
    toast({
      title: "Session Deleted",
      description: `Session for ${selectedSession.interviewerCode} has been deleted.`,
    });
  };
  
  const handleExport = () => {
    exportToCSV(filteredSessions);
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
              <Button onClick={applyFilters} className="bg-cbs hover:bg-cbs-light">
                Apply Filters
              </Button>
              <Button onClick={resetFilters} variant="outline">
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
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.interviewerCode}</TableCell>
                      <TableCell>{formatDateTime(session.startTime)}</TableCell>
                      <TableCell>
                        {session.endTime ? formatDateTime(session.endTime) : (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.endTime ? calculateDuration(session.startTime, session.endTime) : "Ongoing"}
                      </TableCell>
                      <TableCell>
                        {session.startLocation ? (
                          <span className="text-xs">
                            {session.startLocation.latitude.toFixed(4)}, {session.startLocation.longitude.toFixed(4)}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {session.endLocation ? (
                          <span className="text-xs">
                            {session.endLocation.latitude.toFixed(4)}, {session.endLocation.longitude.toFixed(4)}
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
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          {session.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStopSession(session)}
                              title="Stop Session"
                            >
                              <StopCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(session)}
                            title="Delete"
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
              <Input value={selectedSession?.interviewerCode || ""} disabled />
            </div>
            
            <div className="space-y-2">
              <Label>Start Date/Time</Label>
              <Input 
                value={selectedSession ? formatDateTime(selectedSession.startTime) : ""} 
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
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Location (Latitude, Longitude)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Latitude"
                  value={editLocation.latitude}
                  onChange={(e) => setEditLocation({ ...editLocation, latitude: e.target.value })}
                />
                <Input
                  placeholder="Longitude"
                  value={editLocation.longitude}
                  onChange={(e) => setEditLocation({ ...editLocation, longitude: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEdit} className="bg-cbs hover:bg-cbs-light">
              Save Changes
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
            <p>Are you sure you want to delete this session for {selectedSession?.interviewerCode}?</p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Sessions;
