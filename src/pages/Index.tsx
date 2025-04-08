
import React, { useState, useEffect } from "react";
import { Play, Square } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import MainLayout from "@/components/layout/MainLayout";
import { getCurrentLocation } from "@/lib/utils";
import { Session, Location } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { toast } = useToast();
  const [interviewerCode, setInterviewerCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<Location | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Check if there's an active session for this interviewer on code change
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!interviewerCode.trim()) return;
      
      try {
        setLoading(true);
        
        // First get the interviewer by code
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .limit(1);
          
        if (interviewerError) throw interviewerError;
        if (!interviewers || interviewers.length === 0) return;
        
        const interviewerId = interviewers[0].id;
        
        // Then check for active sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', interviewerId)
          .eq('is_active', true)
          .limit(1);
          
        if (sessionError) throw sessionError;
        
        if (sessions && sessions.length > 0) {
          setActiveSession(sessions[0]);
          setIsRunning(true);
          setStartTime(sessions[0].start_time);
          
          if (sessions[0].start_latitude && sessions[0].start_longitude) {
            setStartLocation({
              latitude: sessions[0].start_latitude,
              longitude: sessions[0].start_longitude,
              address: sessions[0].start_address || undefined
            });
          }
        } else {
          setActiveSession(null);
          setIsRunning(false);
          setStartTime(null);
          setStartLocation(undefined);
        }
      } catch (error) {
        console.error("Error checking active session:", error);
        toast({
          title: "Error",
          description: "Could not check active sessions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkActiveSession();
  }, [interviewerCode, toast]);
  
  const handleStartStop = async () => {
    if (!interviewerCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter your interviewer code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the interviewer id from the code
      const { data: interviewers, error: interviewerError } = await supabase
        .from('interviewers')
        .select('id')
        .eq('code', interviewerCode)
        .limit(1);
        
      if (interviewerError) throw interviewerError;
      
      if (!interviewers || interviewers.length === 0) {
        toast({
          title: "Error",
          description: "Interviewer code not found",
          variant: "destructive",
        });
        return;
      }
      
      const interviewerId = interviewers[0].id;
      
      if (!isRunning) {
        // Start a new session
        const currentLocation = await getCurrentLocation();
        
        const { data: session, error: insertError } = await supabase
          .from('sessions')
          .insert([
            {
              interviewer_id: interviewerId,
              start_latitude: currentLocation?.latitude || null,
              start_longitude: currentLocation?.longitude || null,
              start_address: currentLocation?.address || null,
              is_active: true
            }
          ])
          .select()
          .single();
          
        if (insertError) throw insertError;
        
        setActiveSession(session);
        setIsRunning(true);
        setStartTime(session.start_time);
        setStartLocation(currentLocation);
        
        toast({
          title: "Session Started",
          description: `Started at ${new Date().toLocaleTimeString()}`,
        });
      } else {
        // End the current session
        const currentLocation = await getCurrentLocation();
        
        if (!activeSession) return;
        
        const { error: updateError } = await supabase
          .from('sessions')
          .update({
            end_time: new Date().toISOString(),
            end_latitude: currentLocation?.latitude || null,
            end_longitude: currentLocation?.longitude || null,
            end_address: currentLocation?.address || null,
            is_active: false
          })
          .eq('id', activeSession.id);
          
        if (updateError) throw updateError;
        
        setActiveSession(null);
        setIsRunning(false);
        setStartTime(null);
        setStartLocation(undefined);
        
        toast({
          title: "Session Ended",
          description: `Ended at ${new Date().toLocaleTimeString()}`,
        });
      }
    } catch (error) {
      console.error("Error managing session:", error);
      toast({
        title: "Error",
        description: "Could not manage session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cbs mb-2">CBS Interviewer Tracker</h1>
          <p className="text-muted-foreground">Track your interviews and working hours</p>
        </div>
        
        <div className="w-full space-y-6 bg-white p-6 rounded-xl shadow-md">
          <div className="space-y-2">
            <Label htmlFor="interviewer-code">Interviewer Code</Label>
            <Input
              id="interviewer-code"
              placeholder="Enter your code"
              value={interviewerCode}
              onChange={(e) => setInterviewerCode(e.target.value)}
              className="text-lg"
              disabled={loading}
            />
          </div>
          
          {isRunning && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium text-cbs">Session Active</p>
              <p className="text-sm text-gray-600">
                Started at: {startTime ? new Date(startTime).toLocaleTimeString() : 'Unknown'}
              </p>
              {startLocation && (
                <p className="text-sm text-gray-600">
                  Location: {startLocation.latitude.toFixed(4)}, {startLocation.longitude.toFixed(4)}
                </p>
              )}
            </div>
          )}
          
          <div className="flex justify-center pt-4">
            <button
              onClick={handleStartStop}
              disabled={loading || !interviewerCode}
              className={`start-stop-button w-24 h-24 rounded-full flex items-center justify-center ${
                isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
              } ${(loading || !interviewerCode) ? "opacity-50 cursor-not-allowed" : ""} text-white transition-colors`}
            >
              {loading ? (
                <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
              ) : isRunning ? (
                <Square className="h-10 w-10" />
              ) : (
                <Play className="h-10 w-10 ml-1" />
              )}
            </button>
          </div>
        </div>
        
        <p className="mt-6 text-sm text-gray-500">
          {isRunning ? "Press the button to end your session" : "Press the button to start your session"}
        </p>
      </div>
    </MainLayout>
  );
};

export default Index;
