
import { useState, useEffect } from "react";
import { Session, Interviewer } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useDataFetching = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch interviewers
        const { data: interviewersData, error: interviewersError } = await supabase
          .from('interviewers')
          .select('*');
          
        if (interviewersError) throw interviewersError;
        setInterviewers(interviewersData || []);
        
        // Fetch sessions
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
        
        setSessions(transformedSessions || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Setup real-time listener for active sessions
    const channel = supabase
      .channel('public:sessions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sessions' 
      }, () => {
        fetchData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { sessions, interviewers, loading };
};
