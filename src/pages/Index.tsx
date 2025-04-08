
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import SessionForm from "@/components/session/SessionForm";
import { useActiveSession } from "@/hooks/useActiveSession";

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
  
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cbs mb-2">CBS Interviewer Tracker</h1>
          <p className="text-muted-foreground">Track your interviews and working hours</p>
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
        
        <p className="mt-6 text-sm text-gray-500">
          {isRunning ? "Press the button to end your session" : "Press the button to start your session"}
        </p>
      </div>
    </MainLayout>
  );
};

export default Index;
