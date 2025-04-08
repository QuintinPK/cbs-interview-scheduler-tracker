
import React, { useState, useEffect } from "react";
import { Play, Square } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { getCurrentLocation } from "@/lib/utils";
import { Session, Location } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { mockSessions } from "@/lib/mock-data";

const Index = () => {
  const { toast } = useToast();
  const [interviewerCode, setInterviewerCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<Location | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  
  // Check if there's an active session for this interviewer on component mount
  useEffect(() => {
    if (interviewerCode) {
      const activeSession = sessions.find(
        session => session.interviewerCode === interviewerCode && session.isActive
      );
      
      if (activeSession) {
        setIsRunning(true);
        setStartTime(activeSession.startTime);
        setStartLocation(activeSession.startLocation);
      }
    }
  }, [interviewerCode, sessions]);
  
  const handleStartStop = async () => {
    if (!interviewerCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter your interviewer code",
        variant: "destructive",
      });
      return;
    }
    
    if (!isRunning) {
      // Start a new session
      const currentLocation = await getCurrentLocation();
      const newStartTime = new Date().toISOString();
      
      const newSession: Session = {
        id: Date.now().toString(),
        interviewerCode,
        startTime: newStartTime,
        endTime: null,
        startLocation: currentLocation,
        isActive: true,
      };
      
      setSessions([...sessions, newSession]);
      setIsRunning(true);
      setStartTime(newStartTime);
      setStartLocation(currentLocation);
      
      toast({
        title: "Session Started",
        description: `Started at ${new Date().toLocaleTimeString()}`,
      });
    } else {
      // End the current session
      const currentLocation = await getCurrentLocation();
      const updatedSessions = sessions.map(session => {
        if (session.interviewerCode === interviewerCode && session.isActive) {
          return {
            ...session,
            endTime: new Date().toISOString(),
            endLocation: currentLocation,
            isActive: false,
          };
        }
        return session;
      });
      
      setSessions(updatedSessions);
      setIsRunning(false);
      setStartTime(null);
      setStartLocation(undefined);
      
      toast({
        title: "Session Ended",
        description: `Ended at ${new Date().toLocaleTimeString()}`,
      });
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
              disabled={!interviewerCode}
              className={`start-stop-button w-24 h-24 ${
                isRunning ? "running" : "stopped"
              } ${!interviewerCode ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isRunning ? (
                <Square className="h-10 w-10" />
              ) : (
                <Play className="h-10 w-10" />
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
