
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Session } from "@/types";
import { useSessionActions } from "@/hooks/useSessionActions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UnusualSessionsCardProps {
  sessions: Session[];
  onSessionsChange: () => void;
}

const UnusualSessionsCard: React.FC<UnusualSessionsCardProps> = ({ 
  sessions, 
  onSessionsChange 
}) => {
  const { toast } = useToast();
  
  // Find unusual sessions (very long sessions or sessions without end time but marked inactive)
  const unusualSessions = sessions.filter(session => {
    if (!session.end_time && session.is_active === false) return true;
    
    if (session.start_time && session.end_time) {
      const duration = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
      const hours = duration / (1000 * 60 * 60);
      return hours > 12; // Sessions longer than 12 hours
    }
    
    return false;
  });
  
  const { stopSession, updateSession } = useSessionActions(
    // Fix: Pass a proper setter function instead of the sessions array
    (updatedSessions) => {
      // Since we don't have direct access to setSessions here, 
      // we'll trigger the parent refresh callback
      onSessionsChange();
    },
    () => {}, // setLoading - not used in this context
    toast
  );
  
  const handleFixSession = async (session: Session) => {
    if (!session.end_time && session.is_active === false) {
      // Add end time to session
      await updateSession(session.id, {
        end_time: session.start_time, // Set end time same as start time
      });
      onSessionsChange();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Unusual Sessions</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{unusualSessions.length}</div>
        <p className="text-xs text-muted-foreground">
          Sessions requiring attention
        </p>
        
        {unusualSessions.length > 0 && (
          <div className="mt-4 space-y-2">
            {unusualSessions.slice(0, 3).map((session) => (
              <div key={session.id} className="flex items-center justify-between text-sm">
                <span className="truncate">
                  Session {session.id.slice(0, 8)}...
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFixSession(session)}
                >
                  Fix
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnusualSessionsCard;
