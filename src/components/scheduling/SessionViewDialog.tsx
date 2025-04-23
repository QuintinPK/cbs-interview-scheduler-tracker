
import React from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Session } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, Clipboard, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useProjects } from "@/hooks/useProjects";

interface SessionViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
}

export const SessionViewDialog: React.FC<SessionViewDialogProps> = ({
  open,
  onOpenChange,
  session
}) => {
  const { interviewers } = useInterviewers();
  const { projects } = useProjects();

  // Find interviewer and project information
  const interviewer = interviewers.find(i => i.id === session?.interviewer_id);
  const project = projects.find(p => p.id === session?.project_id);

  if (!session) {
    return null;
  }

  // Format dates
  const startTime = session.start_time ? parseISO(session.start_time) : null;
  const endTime = session.end_time ? parseISO(session.end_time) : null;
  
  const formatDate = (date: Date | null) => {
    if (!date) return "Not recorded";
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  // Calculate session duration
  const getDuration = () => {
    if (!startTime || !endTime) return "In progress";
    try {
      return formatDistanceToNow(startTime, { addSuffix: false });
    } catch (error) {
      return "Unknown duration";
    }
  };

  // Count interviews
  const countInterviews = () => {
    if (!session.interviews) return 0;
    return session.interviews.length;
  };

  // Count interview results
  const countInterviewsByResult = (result: string | null) => {
    if (!session.interviews) return 0;
    return session.interviews.filter(i => i.result === result).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
          <DialogDescription>
            Information about this session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Basic info */}
          <div className="border rounded-md p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Interviewer:</span>
              <span>
                {interviewer ? `${interviewer.code}: ${interviewer.first_name} ${interviewer.last_name}` : "Unknown"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Project:</span>
              <span>{project ? project.name : "Not assigned"}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Start time:</span>
              <span>{formatDate(startTime)}</span>
            </div>
            
            {endTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">End time:</span>
                <span>{formatDate(endTime)}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Duration:</span>
              <span>{getDuration()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${session.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="font-medium">Status:</span>
              <span>{session.is_active ? "Active" : "Ended"}</span>
            </div>
          </div>

          {/* Location info */}
          {(session.start_latitude || session.end_latitude) && (
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="font-medium text-md">Location Information</h3>
              
              {session.start_latitude && session.start_longitude && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Start location:</span>
                  </div>
                  <div className="pl-6 text-sm">
                    <div>Coordinates: {session.start_latitude}, {session.start_longitude}</div>
                    {session.start_address && <div>Address: {session.start_address}</div>}
                  </div>
                </div>
              )}
              
              {session.end_latitude && session.end_longitude && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">End location:</span>
                  </div>
                  <div className="pl-6 text-sm">
                    <div>Coordinates: {session.end_latitude}, {session.end_longitude}</div>
                    {session.end_address && <div>Address: {session.end_address}</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interview stats */}
          {session.interviews && session.interviews.length > 0 && (
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="font-medium text-md">Interview Statistics</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Clipboard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Total interviews:</span>
                  <span>{countInterviews()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Completed:</span>
                  <span>{countInterviewsByResult("completed")}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Refused:</span>
                  <span>{countInterviewsByResult("refused")}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Not home:</span>
                  <span>{countInterviewsByResult("not_home")}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
