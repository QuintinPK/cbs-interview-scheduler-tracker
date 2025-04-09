
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SessionForm from "@/components/session/SessionForm";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useSyncManager } from "@/hooks/useSyncManager";
import { supabase } from "@/integrations/supabase/client";
import { formatTime } from "@/lib/utils";
import { DollarSign, WifiOff, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    endSession,
    isOfflineSession,
    setIsOfflineSession,
    interviewerId,
    isOnline
  } = useActiveSession();

  const { 
    pendingCount, 
    syncPendingSessions, 
    isSyncing 
  } = useSyncManager();

  const [totalHours, setTotalHours] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number>(25);
  const [isLoadingHours, setIsLoadingHours] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the hourly rate
  useEffect(() => {
    const fetchHourlyRate = async () => {
      if (!isOnline) return; // Skip if offline
      
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
  }, [isOnline]);
  
  // Fetch total hours for the current interviewer
  useEffect(() => {
    const fetchTotalHours = async () => {
      if (!interviewerCode || !isOnline) return;
      
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
          .select('start_time, end_time')
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
  }, [interviewerCode, isOnline]);
  
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cbs mb-2">CBS Interviewer Portal</h1>
          <p className="text-muted-foreground">Track your working hours</p>
          {!isOnline && (
            <Badge variant="outline" className="mt-2 bg-amber-100 text-amber-800 border-amber-300">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Mode
            </Badge>
          )}
          {isOnline && pendingCount > 0 && (
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-blue-300 text-blue-700"
                onClick={syncPendingSessions}
                disabled={isSyncing}
              >
                <Database className="h-3 w-3 mr-1" />
                Sync {pendingCount} Pending Session{pendingCount > 1 ? 's' : ''}
              </Button>
            </div>
          )}
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
          isOfflineSession={isOfflineSession}
          setIsOfflineSession={setIsOfflineSession}
          interviewerId={interviewerId}
          isOnline={isOnline}
        />
        
        {interviewerCode && (
          <div className="w-full space-y-6 mt-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 mr-2 text-cbs" />
                <h3 className="font-medium text-cbs">Total Earnings</h3>
                {!isOnline && (
                  <span className="ml-auto text-xs text-amber-600">
                    <WifiOff className="h-3 w-3 inline mr-1" />
                    Offline
                  </span>
                )}
              </div>
              
              <p className="text-xl font-bold mb-2">
                {isLoadingHours ? "Calculating..." : 
                 !isOnline ? "Available when online" :
                 `$${(totalHours * hourlyRate).toFixed(2)}`}
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
          {!isOnline && " (offline mode)"}
        </p>
      </div>
    </MainLayout>
  );
};

export default Index;
