
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SessionForm from "@/components/session/SessionForm";
import { useActiveSession } from "@/hooks/useActiveSession";
import { supabase } from "@/integrations/supabase/client";
import { formatTime } from "@/lib/utils";
import { DollarSign } from "lucide-react";

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
  
  // Fetch total hours for the current interviewer
  useEffect(() => {
    const fetchTotalHours = async () => {
      if (!interviewerCode) return;
      
      try {
        setIsLoadingHours(true);
        
        // Get the interviewer ID first
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .limit(1);
          
        if (interviewerError) throw interviewerError;
        if (!interviewers || interviewers.length === 0) return;
        
        const interviewerId = interviewers[0].id;
        
        // Fetch all completed sessions for this interviewer
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('start_time, end_time')
          .eq('interviewer_id', interviewerId)
          .not('end_time', 'is', null);
          
        if (sessionsError) throw sessionsError;
        
        // Calculate total hours
        let totalMinutes = 0;
        
        if (sessions && sessions.length > 0) {
          sessions.forEach(session => {
            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
          });
        }
        
        // Convert minutes to hours
        setTotalHours(totalMinutes / 60);
      } catch (error) {
        console.error("Error fetching total hours:", error);
      } finally {
        setIsLoadingHours(false);
      }
    };
    
    fetchTotalHours();
  }, [interviewerCode]);
  
  // Fetch the hourly rate
  useEffect(() => {
    const fetchHourlyRate = async () => {
      try {
        const { data: response, error } = await supabase.functions.invoke('admin-functions', {
          body: {
            action: "getHourlyRate"
          }
        });
        
        if (error) {
          console.error("Error fetching hourly rate:", error);
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
      }
    };
    
    fetchHourlyRate();
  }, []);
  
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cbs mb-2">CBS Interviewer Portal</h1>
          <p className="text-muted-foreground">Track your working hours</p>
        </div>
        
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
              
              <p className="text-xs text-gray-500 mt-2">
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
