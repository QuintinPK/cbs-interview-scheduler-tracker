
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import { formatTime } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ActiveInterviewersCard: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load interviewers
        const { data: interviewersData, error: interviewersError } = await supabase
          .from('interviewers')
          .select('*');
          
        if (interviewersError) throw interviewersError;
        setInterviewers(interviewersData || []);
        
        // Load active sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('is_active', true);
          
        if (sessionsError) throw sessionsError;
        setActiveSessions(sessionsData || []);
      } catch (error) {
        console.error("Error loading active sessions:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Set up real-time subscription for active sessions
    const subscription = supabase
      .channel('public:sessions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sessions'
      }, () => {
        // Refresh the data when sessions change
        loadData();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Get interviewer code from ID
  const getInterviewerCode = (interviewerId: string) => {
    const interviewer = interviewers.find(i => i.id === interviewerId);
    return interviewer ? interviewer.code : 'Unknown';
  };
  
  return (
    <Card>
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
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-cbs" />
          </div>
        ) : activeSessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No active interviewers at the moment</p>
        ) : (
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium">{getInterviewerCode(session.interviewer_id)}</p>
                  <p className="text-sm text-muted-foreground">
                    Started at {formatTime(session.start_time)}
                  </p>
                </div>
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
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
