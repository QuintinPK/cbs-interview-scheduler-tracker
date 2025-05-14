
import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SessionForm from "@/components/session/SessionForm";
import { useActiveSession } from "@/hooks/useActiveSession";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Interview } from "@/types";
import { isOnline, getUnsyncedSessionsCount, syncOfflineSessions } from "@/lib/offlineDB";
import { WifiOff } from "lucide-react";

const Index = () => {
  // Performance monitoring
  const pageLoadTime = performance.now();
  console.log("Index page initial render started at:", pageLoadTime);
  
  // Load the active session hook with all authentication and session state
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
    startSession,
    offlineSessionId,
    validateInterviewerCode
  } = useActiveSession();
  
  useEffect(() => {
    const renderTime = performance.now() - pageLoadTime;
    console.log("Index - Initial render completed in:", renderTime + "ms");
  }, []);

  // Debug logging to track state
  useEffect(() => {
    console.log("Index - isPrimaryUser:", isPrimaryUser);
    console.log("Index - interviewerCode:", interviewerCode);
    console.log("Index - validateInterviewerCode available:", !!validateInterviewerCode);
  }, [isPrimaryUser, interviewerCode, validateInterviewerCode]);

  // Additional debug logging for the login function
  useEffect(() => {
    console.log("Index - validateInterviewerCode function exists:", typeof validateInterviewerCode === 'function');
  }, [validateInterviewerCode]);

  const [totalHours, setTotalHours] = useState<number>(0);
  const [isLoadingHours, setIsLoadingHours] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewsCount, setInterviewsCount] = useState<number>(0);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  
  // Check for unsynced sessions periodically
  const checkUnsyncedSessions = useCallback(async () => {
    try {
      const count = await getUnsyncedSessionsCount();
      setUnsyncedCount(count);
    } catch (err) {
      console.error("Error checking unsynced sessions:", err);
    }
  }, []);
  
  useEffect(() => {
    checkUnsyncedSessions();
    
    const intervalId = setInterval(checkUnsyncedSessions, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [checkUnsyncedSessions]);
  
  // Improved function to sync all data with visual feedback
  const performSync = async () => {
    // Don't sync if already offline
    if (!isOnline()) {
      return;
    }
    
    try {
      const result = await syncOfflineSessions();
      
      // Update the count after sync attempt
      await checkUnsyncedSessions();
      
      return result;
    } catch (err) {
      console.error("Error during sync:", err);
      return false;
    }
  };
  
  // Fetch total hours and interviews for the current interviewer with better error handling
  useEffect(() => {
    const fetchInterviewerData = async () => {
      if (!interviewerCode || !isOnline()) return;
      
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
          
          {!isOnline() && (
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Mode
            </div>
          )}
        </div>
        
        {unsyncedCount > 0 && (
          <Alert className="mb-4 w-full bg-blue-50 border-blue-200 text-blue-800">
            <AlertDescription className="flex items-center justify-between">
              <span>
                {unsyncedCount} offline {unsyncedCount === 1 ? 'session' : 'sessions'} not yet synchronized
              </span>
              {isOnline() && (
                <button 
                  onClick={performSync}
                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs"
                >
                  Sync Now
                </button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
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
          startSession={startSession}
          offlineSessionId={offlineSessionId}
          validateInterviewerCode={validateInterviewerCode}
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
