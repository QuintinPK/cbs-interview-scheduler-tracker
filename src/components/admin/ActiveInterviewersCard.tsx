
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer, Project } from "@/types";
import { formatTime } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ActiveInterviewersCardProps {
  sessions: Session[];
  interviewers?: Interviewer[];
  loading?: boolean;
  projects?: Project[];
}

const ActiveInterviewersCard: React.FC<ActiveInterviewersCardProps> = ({
  sessions,
  interviewers = [],
  loading = false,
  projects = []
}) => {
  const navigate = useNavigate();
  
  // Get only active sessions
  const activeSessions = sessions.filter(session => session.is_active);
  
  // Get interviewer code from ID
  const getInterviewerCode = (interviewerId: string) => {
    const interviewer = interviewers.find(i => i.id === interviewerId);
    return interviewer ? interviewer.code : 'Unknown';
  };

  // Get project name from ID
  const getProjectName = (projectId: string | null) => {
    if (!projectId) return 'No project';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown project';
  };
  
  const handleInterviewerClick = (interviewerId: string) => {
    navigate(`/admin/interviewer/${interviewerId}`);
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <span className="relative mr-2">
            <span className="absolute top-1 left-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="absolute top-1 left-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <span className="ml-3">Active Interviewers</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : activeSessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No active interviewers</p>
        ) : (
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div 
                key={session.id} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleInterviewerClick(session.interviewer_id)}
              >
                <div>
                  <p className="font-medium">{getInterviewerCode(session.interviewer_id)}</p>
                  <p className="text-sm text-muted-foreground">
                    Started at {formatTime(session.start_time)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getProjectName(session.project_id)}
                  </p>
                </div>
                <div className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                  Active
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveInterviewersCard;
