
import React, { useState } from 'react';
import { Session, Interview } from '@/types';
import CoordinatePopup from '../ui/CoordinatePopup';
import { SessionTable } from './SessionTable';

interface SessionHistoryProps {
  sessions: Session[];
  interviews: Interview[];
  showProject: boolean;
  projectNameResolver: (id: string) => string;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  interviews,
  showProject,
  projectNameResolver
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // This is just a placeholder as we're in the interviewer's context
  const getInterviewerCode = (id: string) => id;

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const handleCoordinateClick = (lat: number | null, lng: number | null) => {
    if (lat !== null && lng !== null) {
      setSelectedCoordinate({ lat, lng });
      setIsMapOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Session History</h3>
      </div>

      <SessionTable 
        sessions={sessions}
        interviews={interviews}
        expandedSessions={expandedSessions}
        toggleSessionExpanded={toggleSessionExpanded}
        handleCoordinateClick={handleCoordinateClick}
        showProject={showProject}
        getProjectName={projectNameResolver}
        getInterviewerCode={getInterviewerCode}
      />
      
      <CoordinatePopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        coordinate={selectedCoordinate}
      />
    </div>
  );
};

export default SessionHistory;
