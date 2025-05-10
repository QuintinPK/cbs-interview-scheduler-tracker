
import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Session, Interview } from '@/types';
import CoordinatePopup from '../ui/CoordinatePopup';
import { SessionTable } from './SessionTable';
import { DateRangeSelector } from './DateRangeSelector';

interface SessionHistoryProps {
  sessions: Session[];
  interviews: Interview[];
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  showProject: boolean;
  projectNameResolver: (id: string) => string;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  interviews,
  dateRange,
  setDateRange,
  showProject,
  projectNameResolver
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [selectedCoordinate, setSelectedCoordinate] = useState<{latitude: number, longitude: number} | null>(null);
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
      setSelectedCoordinate({ latitude: lat, longitude: lng });
      setIsMapOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold">Session History</h3>
        <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />
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
