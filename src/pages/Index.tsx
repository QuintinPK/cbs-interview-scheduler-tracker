
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SessionForm from "@/components/session/SessionForm";
import { useActiveSession } from "@/hooks/useActiveSession";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Interview } from "@/types";

const Index = () => {
  const {
    interviewerCode,
    setInterviewerCode,
    isRunning,
    setIsRunning,
    startTime,
    setStartTime,
    startLocation,
    setStartLocation,
    activeSession,
    setActiveSession,
    isPrimaryUser,
    setIsPrimaryUser,
    switchUser,
    endSession
  } = useActiveSession();

  const [totalHours, setTotalHours] = useState<number>(0);
  const [isLoadingHours, setIsLoadingHours] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewsCount, setInterviewsCount] = useState<number>(0);
  
  // Fetch total hours and interviews for the current interviewer
  useEffect(() => {
    const fetchInterviewerData = async () => {
      if (!interviewerCode) return;
      
      try {
        setIsLoadingHours(true);
        setError(null);
        
        // Get the interviewer ID first
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .limit(1);
          
        if (interviewerError) {
          console.error("Error fetching interviewer:", interviewerError);
          setError("Could not load interviewer data");
          throw interviewerError;
        }
        
        if (!interviewers || interviewers.length === 0) return;
        
        const interviewerId = interviewers[0].id;
        
        // Fetch all completed sessions for this interviewer
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, start_time, end_time')
          .eq('interviewer_id', interviewerId)
          .not('end_time', 'is', null);
          
        if (sessionsError) {
          console.error("Error fetching sessions:", sessionsError);
          setError("Could not load session data");
          throw sessionsError;
        }
        
        // Calculate total hours
        let totalMinutes = 0;
        
        if (sessions && sessions.length > 0) {
          sessions.forEach(session => {
            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
          });
          
          // Fetch interviews count
          const sessionIds = sessions.map(s => s.id);
          
          if (sessionIds.length > 0) {
            // Use any to bypass type checking temporarily
            const { count, error: countError } = await (supabase as any)
              .from('interviews')
              .select('id', { count: 'exact' })
              .in('session_id', sessionIds)
              .not('result', 'is', null);
              
            if (countError) {
              console.error("Error counting interviews:", countError);
            } else {
              setInterviewsCount(count || 0);
            }
          }
        }
        
        // Convert minutes to hours
        setTotalHours(totalMinutes / 60);
      } catch (error) {
        console.error("Error fetching interviewer data:", error);
      } finally {
        setIsLoadingHours(false);
      }
    };
    
    fetchInterviewerData();
  }, [interviewerCode]);
  
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cbs mb-2">CBS Interviewer Portal</h1>
          <p className="text-muted-foreground">Track your working hours</p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4 w-full">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <SessionForm
          interviewerCode={interviewerCode}
          setInterviewerCode={setInterviewerCode}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          startTime={startTime}
          setStartTime={setStartTime}
          startLocation={startLocation}
          setStartLocation={setStartLocation}
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          isPrimaryUser={isPrimaryUser}
          switchUser={switchUser}
          endSession={endSession}
        />
        
        {interviewerCode && (
          <div className="w-full space-y-6 mt-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                <div className="p-2 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-500">Total Hours</p>
                  <p className="font-semibold">{isLoadingHours ? "..." : totalHours.toFixed(1)}</p>
                </div>
                
                <div className="p-2 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-500">Interviews</p>
                  <p className="font-semibold">{isLoadingHours ? "..." : interviewsCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <p className="mt-6 text-sm text-gray-500">
          {isRunning ? "Press the button to end your session" : "Press the button to start your session"}
        </p>
      </div>
    </MainLayout>
  );
};

export default Index;
