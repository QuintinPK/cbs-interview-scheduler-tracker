import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SessionForm from "@/components/session/SessionForm";
import { useActiveSession } from "@/hooks/useActiveSession";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";
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
  const [hourlyRate, setHourlyRate] = useState<number>(25);
  const [isLoadingHours, setIsLoadingHours] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewsCount, setInterviewsCount] = useState<number>(0);
  
  useEffect(() => {
    const fetchHourlyRate = async () => {
      try {
        setError(null);
        console.log("Fetching hourly rate");
        
        const { data: response, error } = await supabase.functions.invoke('admin-functions', {
          body: {
            action: "getHourlyRate"
          }
        });
        
        if (error) {
          console.error("Error fetching hourly rate:", error);
          setError("Could not load hourly rate");
          return;
        }
        
        console.log("Hourly rate response:", response);
        
        if (response && response.data && response.data.hourlyRate !== undefined) {
          const rate = Number(response.data.hourlyRate);
          if (!isNaN(rate)) {
            console.log("Setting hourly rate to:", rate);
            setHourlyRate(rate);
          }
        }
      } catch (error) {
        console.error("Error fetching hourly rate:", error);
        setError("Could not load hourly rate");
      }
    };
    
    fetchHourlyRate();
  }, []);
  
  useEffect(() => {
    const fetchInterviewerData = async () => {
      if (!interviewerCode) return;
      
      try {
        setIsLoadingHours(true);
        setError(null);
        
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
        
        let totalMinutes = 0;
        
        if (sessions && sessions.length > 0) {
          sessions.forEach(session => {
            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
          });
          
          const sessionIds = sessions.map(s => s.id);
          
          if (sessionIds.length > 0) {
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
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 mr-2 text-cbs" />
                <h3 className="font-medium text-cbs">Total Earnings</h3>
              </div>
              
              <p className="text-xl font-bold mb-2">
                {isLoadingHours ? "Calculating..." : `$${(totalHours * hourlyRate).toFixed(2)}`}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                <div className="p-2 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-500">Total Hours</p>
                  <p className="font-semibold">{totalHours.toFixed(1)}</p>
                </div>
                
                <div className="p-2 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-500">Interviews</p>
                  <p className="font-semibold">{interviewsCount}</p>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                The displayed earnings are based on the total number of hours tracked and are intended as an indicative total base estimate only. 
                Adjustments may still be made. Any previous payments are not reflected, and response/non-response bonuses are excluded.
              </p>
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
