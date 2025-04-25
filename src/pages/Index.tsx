
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import SessionForm from "@/components/session/SessionForm";
import { useActiveSession } from "@/hooks/useActiveSession";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    loading,
    isPrimaryUser,
    switchUser,
    endSession,
    verifyInterviewerCode
  } = useActiveSession();

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-center mb-4">Interviewer Portal</h1>
        
        <div className="space-y-6">
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
            verifyInterviewerCode={verifyInterviewerCode}
          />
          
          {loading && (
            <Alert className="animate-pulse">
              <AlertDescription>Loading...</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
