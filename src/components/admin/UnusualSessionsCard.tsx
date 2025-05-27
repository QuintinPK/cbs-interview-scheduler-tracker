
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
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSessionActions } from "@/hooks/useSessionActions";
import { formatInTimeZone } from 'date-fns-tz';
import { getHours } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface UnusualSessionsCardProps {
  sessions: Session[];
  interviewers: Interviewer[];
  loading?: boolean;
  threshold?: number;
}

const UnusualSessionsCard: React.FC<UnusualSessionsCardProps> = ({
  sessions,
  interviewers,
  loading = false,
  threshold = 120
}) => {
  const [unusualSessions, setUnusualSessions] = useState<Session[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sessionToMarkAsSeen, setSessionToMarkAsSeen] = useState<string | null>(null);
  const { toast } = useToast();
  const { updateSession, deleteSession } = useSessionActions(
    sessions, 
    () => {}, // We'll handle state updates manually
    unusualSessions,
    () => {}
  );

  const isUnusualStartTime = (startTime: string): boolean => {
    const hour = getHours(new Date(startTime));
    return hour < 7 || hour >= 21;
  };
  
  useMemo(() => {
    const unusualSessions = sessions.filter(session => {
      if (session.is_unusual_reviewed) {
        return false;
      }
      
      if (!session.end_time || session.is_active) {
        return false;
      }
      
      const start = new Date(session.start_time).getTime();
      const end = new Date(session.end_time).getTime();
      const durationMinutes = (end - start) / (1000 * 60);
      
      return durationMinutes > threshold || isUnusualStartTime(session.start_time);
    });
    
    const sorted = unusualSessions.sort((a, b) => {
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
    
    const startDateTime = formatInTimeZone(
      new Date(session.start_time),
      'America/Puerto_Rico',
      "yyyy-MM-dd'T'HH:mm"
    );
    
    const endDateTime = session.end_time 
      ? formatInTimeZone(
          new Date(session.end_time),
          'America/Puerto_Rico',
          "yyyy-MM-dd'T'HH:mm"
        )
      : '';
    
    setStartTime(startDateTime);
    setEndTime(endDateTime);
    setIsEditDialogOpen(true);
  };
  
  const handleSaveEdit = async () => {
    if (!editingSession) return;
    
    const success = await updateSession(editingSession.id, {
      start_time: startTime,
      end_time: endTime
    });
    
    if (success) {
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
      setUnusualSessions(prev => prev.filter(s => s.id !== editingSession.id));
      setIsEditDialogOpen(false);
    }
  };
  
  const handleMarkAsSeen = async (sessionId: string) => {
    setSessionToMarkAsSeen(sessionId);
  };
  
  const confirmMarkAsSeen = async () => {
    if (!sessionToMarkAsSeen) return;
    
    const { error } = await supabase
      .from('sessions')
      .update({ is_unusual_reviewed: true })
      .eq('id', sessionToMarkAsSeen);
    
    if (error) {
      console.error("Error marking session as seen:", error);
      toast({
        title: "Error",
        description: "Could not mark session as seen",
        variant: "destructive",
      });
      return;
    }
    
    setUnusualSessions(prev => prev.filter(s => s.id !== sessionToMarkAsSeen));
    
    toast({
      title: "Session Approved",
      description: "This unusual session has been marked as seen and will not appear in this list again.",
    });
    
    setSessionToMarkAsSeen(null);
  };
  
  const cancelMarkAsSeen = () => {
    setSessionToMarkAsSeen(null);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Unusual Sessions (Over {threshold} minutes or outside 7am-9pm)
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
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unusualSessions.map(session => {
                    const isUnusualTime = isUnusualStartTime(session.start_time);
                    const rowClass = isUnusualTime ? 'bg-amber-50' : '';
                    
                    return (
                      <TableRow key={session.id} className={`hover:bg-gray-50 ${rowClass}`}>
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isUnusualTime
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {isUnusualTime ? "Unusual Time" : "Long Duration"}
                          </span>
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={sessionToMarkAsSeen !== null} onOpenChange={cancelMarkAsSeen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Session as Seen?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this unusual session as seen? It will be removed from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelMarkAsSeen}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkAsSeen}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
