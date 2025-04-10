
import { useState, useEffect } from "react";
import { Session } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useSessions = (
  interviewerId?: string,
  startDate?: string,
  endDate?: string
) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!interviewerId) {
        setSessions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let query = supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', interviewerId);

        // Add date filtering if provided
        if (startDate) {
          query = query.gte('start_time', `${startDate}T00:00:00.000Z`);
        }
        
        if (endDate) {
          query = query.lte('start_time', `${endDate}T23:59:59.999Z`);
        }
          
        const { data, error } = await query.order('start_time');
          
        if (error) throw error;
        
        // Format and transform the data
        const formattedSessions: Session[] = (data || []).map(session => ({
          id: session.id,
          interviewer_id: session.interviewer_id,
          start_time: session.start_time,
          end_time: session.end_time,
          start_latitude: session.start_latitude,
          start_longitude: session.start_longitude,
          start_address: session.start_address,
          end_latitude: session.end_latitude,
          end_longitude: session.end_longitude,
          end_address: session.end_address,
          is_active: session.is_active
        }));
        
        setSessions(formattedSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessions();
  }, [interviewerId, startDate, endDate]);

  return { sessions, loading };
};
