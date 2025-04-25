
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Pencil, Eye, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSessionActions } from "@/hooks/useSessionActions";

interface UnusualSessionsCardProps {
  sessions: Session[];
  interviewers: Interviewer[];
  loading?: boolean;
  threshold?: number; // in minutes
}

const UnusualSessionsCard: React.FC<UnusualSessionsCardProps> = ({
  sessions,
  interviewers,
  loading = false,
  threshold = 120 // Default: 2 hours
}) => {
  const [unusualSessions, setUnusualSessions] = useState<Session[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const { toast } = useToast();
  const { updateSession, deleteSession } = useSessionActions(
    sessions, 
    () => {}, // We'll handle state updates manually
    unusualSessions,
    () => {},
    toast
  );
  
  // Initialize unusual sessions
  useMemo(() => {
    // Filter for completed sessions longer than the threshold
    const longSessions = sessions.filter(session => {
      if (!session.end_time || session.is_active) {
        return false;
      }
      
      const start = new Date(session.start_time).getTime();
      const end = new Date(session.end_time).getTime();
      const durationMinutes = (end - start) / (1000 * 60);
      
      return durationMinutes > threshold;
    });
    
    // Sort by duration (longest first)
    const sorted = longSessions.sort((a, b) => {
      const durationA = new Date(a.end_time!).getTime() - new Date(a.start_time).getTime();
      const durationB = new Date(b.end_time!).getTime() - new Date(b.start_time).getTime();
      return durationB - durationA;
    });
    
    setUnusualSessions(sorted);
  }, [sessions, threshold]);
  
  const getInterviewerCode = (interviewerId: string): string => {
    const interviewer = interviewers.find(i => i.id === interviewerId);
    return interviewer ? interviewer.code : "Unknown";
  };
  
  const handleEditClick = (session: Session) => {
    setEditingSession(session);
    // Format the datetime for the datetime-local input (YYYY-MM-DDThh:mm)
    setStartTime(session.start_time.substring(0, 16));
    setEndTime(session.end_time ? session.end_time.substring(0, 16) : '');
    setIsEditDialogOpen(true);
  };
  
  const handleSaveEdit = async () => {
    if (!editingSession) return;
    
    const success = await updateSession(editingSession.id, {
      start_time: startTime,
      end_time: endTime
    });
    
    if (success) {
      // Update local state
      setUnusualSessions(prev => 
        prev.map(s => 
          s.id === editingSession.id 
            ? { ...s, start_time: startTime, end_time: endTime } 
            : s
        )
      );
      setIsEditDialogOpen(false);
    }
  };
  
  const handleDelete = async () => {
    if (!editingSession) return;
    
    const success = await deleteSession(editingSession.id);
    
    if (success) {
      // Remove from local state
      setUnusualSessions(prev => prev.filter(s => s.id !== editingSession.id));
      setIsEditDialogOpen(false);
    }
  };
  
  const handleMarkAsSeen = async (sessionId: string) => {
    // Remove from unusual sessions list without deleting the actual session
    setUnusualSessions(prev => prev.filter(s => s.id !== sessionId));
    
    toast({
      title: "Session Approved",
      description: "This unusual session has been marked as seen and removed from the list.",
    });
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Unusual Sessions (Over {threshold} minutes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : unusualSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No unusual sessions found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interviewer</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unusualSessions.map(session => (
                    <TableRow key={session.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Link 
                          to={`/admin/sessions`} 
                          className="font-medium hover:underline"
                        >
                          {getInterviewerCode(session.interviewer_id)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/sessions`} className="hover:underline">
                          {formatDateTime(session.start_time)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/sessions`} className="hover:underline">
                          {formatDateTime(session.end_time!)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/sessions`} className="hover:underline">
                          {calculateDuration(session.start_time, session.end_time!)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClick(session)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleMarkAsSeen(session.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Seen
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog with Delete option inside */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session Times</DialogTitle>
            <DialogDescription>
              Adjust the start and end times for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="start-time" className="text-sm font-medium">
                Start Time
              </label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-time" className="text-sm font-medium">
                End Time
              </label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button 
                variant="destructive" 
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Session
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnusualSessionsCard;
