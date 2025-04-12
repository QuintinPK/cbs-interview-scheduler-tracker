
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Session, Interview } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import InterviewsList from '@/components/session/InterviewsList';
import SessionList from '@/components/session/SessionList';

interface SessionHistoryProps {
  sessions: Session[];
  dateRange: { startDate: string; endDate: string } | undefined;
  setDateRange: (dateRange: { startDate: string; endDate: string } | undefined) => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  dateRange,
  setDateRange,
}) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInterviews = async () => {
    if (!sessions || sessions.length === 0) {
      setInterviews([]);
      return;
    }

    try {
      setLoading(true);
      
      const sessionIds = sessions.map(session => session.id);
      
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .in('session_id', sessionIds)
        .order('start_time', { ascending: false });
        
      if (error) throw error;
      
      setInterviews(data as Interview[]);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [sessions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Session History</CardTitle>
          <div className="flex items-center space-x-2">
            <DatePickerWithRange 
              value={
                dateRange 
                  ? { 
                      from: new Date(dateRange.startDate), 
                      to: new Date(dateRange.endDate) 
                    } 
                  : undefined
              }
              onChange={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({
                    startDate: format(range.from, 'yyyy-MM-dd'),
                    endDate: format(range.to, 'yyyy-MM-dd'),
                  });
                } else {
                  setDateRange(undefined);
                }
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sessions">
          <TabsList className="mb-4">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions">
            <SessionList sessions={sessions} loading={loading} />
          </TabsContent>
          
          <TabsContent value="interviews">
            <InterviewsList 
              interviews={interviews} 
              refreshInterviews={fetchInterviews} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
