
import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody
} from "@/components/ui/table";
import { Interview, Project, Session } from "@/types";
import { Loader2 } from "lucide-react";
import { calculateDuration } from "@/utils/sessionUtils";
import { useSessionSorting } from "@/hooks/useSessionSorting";
import CoordinatePopup from "../ui/CoordinatePopup";
import { SessionRow } from "./SessionRow";
import { SessionTableHeader } from "./SessionTableHeader";
import InterviewsList from "./InterviewsList";
import { SessionsTableStatus } from "./SessionsTableStatus";

interface SessionListProps {
  sessions: Session[];
  loading: boolean;
  getInterviewerCode: (interviewerId: string) => string;
  getSessionInterviews: (sessionId: string) => Promise<Interview[]>;
  getSessionInterviewsCount: (sessionId: string) => Promise<number>;
  onEdit: (session: Session) => void;
  onStop: (session: Session) => void;
  onDelete: (session: Session) => void;
  projects: Project[];
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  loading,
  getInterviewerCode,
  getSessionInterviews,
  getSessionInterviewsCount,
  onEdit,
  onStop,
  onDelete,
  projects
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [sessionInterviews, setSessionInterviews] = useState<Record<string, Interview[]>>({});
  const [interviewCounts, setInterviewCounts] = useState<Record<string, number>>({});
  const [loadingInterviews, setLoadingInterviews] = useState<Record<string, boolean>>({});
  const [loadingCounts, setLoadingCounts] = useState<Record<string, boolean>>({});
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const getProjectName = (projectId: string | undefined | null): string => {
    if (!projectId) return "No project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown project";
  };

  const {
    sortedSessions,
    sortField,
    sortDirection,
    toggleSort
  } = useSessionSorting(sessions, getInterviewerCode, getProjectName);

  useEffect(() => {
    const loadAllInterviewCounts = async () => {
      const newLoadingCounts = { ...loadingCounts };
      
      for (const session of sessions) {
        if (interviewCounts[session.id] === undefined) {
          newLoadingCounts[session.id] = true;
        }
      }
      
      setLoadingCounts(newLoadingCounts);
      
      const countsPromises = sessions.map(async (session) => {
        if (interviewCounts[session.id] === undefined) {
          try {
            const count = await getSessionInterviewsCount(session.id);
            return { sessionId: session.id, count };
          } catch (error) {
            console.error("Error fetching interview count:", error);
            return { sessionId: session.id, count: 0 };
          }
        }
        return { sessionId: session.id, count: interviewCounts[session.id] };
      });
      
      const results = await Promise.all(countsPromises);
      
      const newCounts = { ...interviewCounts };
      results.forEach(({ sessionId, count }) => {
        newCounts[sessionId] = count;
        newLoadingCounts[sessionId] = false;
      });
      
      setInterviewCounts(newCounts);
      setLoadingCounts(newLoadingCounts);
    };
    
    if (sessions.length > 0) {
      loadAllInterviewCounts();
    }
  }, [sessions]);

  const toggleSessionExpanded = async (sessionId: string) => {
    const newExpandedSessions = { ...expandedSessions };
    newExpandedSessions[sessionId] = !expandedSessions[sessionId];
    setExpandedSessions(newExpandedSessions);

    if (newExpandedSessions[sessionId] && !sessionInterviews[sessionId]) {
      setLoadingInterviews({ ...loadingInterviews, [sessionId]: true });
      try {
        const interviews = await getSessionInterviews(sessionId);
        setSessionInterviews({ ...sessionInterviews, [sessionId]: interviews });
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoadingInterviews({ ...loadingInterviews, [sessionId]: false });
      }
    }
  };

  const refreshInterviews = async (sessionId: string) => {
    if (!sessionInterviews[sessionId]) return;
    
    setLoadingInterviews({ ...loadingInterviews, [sessionId]: true });
    try {
      const interviews = await getSessionInterviews(sessionId);
      setSessionInterviews({ ...sessionInterviews, [sessionId]: interviews });
      
      setInterviewCounts({ 
        ...interviewCounts, 
        [sessionId]: interviews.length 
      });
    } catch (error) {
      console.error("Error refreshing interviews:", error);
    } finally {
      setLoadingInterviews({ ...loadingInterviews, [sessionId]: false });
    }
  };

  const handleCoordinateClick = (lat: number | null, lng: number | null) => {
    if (lat !== null && lng !== null) {
      setSelectedCoordinate({ lat, lng });
      setIsMapOpen(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <SessionTableHeader 
              sortField={sortField}
              sortDirection={sortDirection}
              toggleSort={toggleSort}
            />
            <TableBody>
              <SessionsTableStatus 
                loading={loading}
                isEmpty={sortedSessions.length === 0}
                colSpan={10}
              />
              
              {!loading && sortedSessions.length > 0 && sortedSessions.map((session) => (
                <React.Fragment key={session.id}>
                  <SessionRow 
                    session={session}
                    isExpanded={!!expandedSessions[session.id]}
                    interviewCount={interviewCounts[session.id] || 0}
                    loadingCount={!!loadingCounts[session.id]}
                    getInterviewerCode={getInterviewerCode}
                    getProjectName={getProjectName}
                    calculateDuration={calculateDuration}
                    toggleSessionExpanded={toggleSessionExpanded}
                    handleCoordinateClick={handleCoordinateClick}
                    onEdit={onEdit}
                    onStop={onStop}
                    onDelete={onDelete}
                    loading={loading}
                  />
                  
                  {expandedSessions[session.id] && interviewCounts[session.id] > 0 && (
                    <>
                      {loadingInterviews[session.id] ? (
                        <tr>
                          <td colSpan={9} className="p-0 border-t-0 bg-gray-50">
                            <div className="flex justify-center items-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-cbs" />
                              <span className="ml-2 text-gray-500">Loading interviews...</span>
                            </div>
                          </td>
                        </tr>
                      ) : sessionInterviews[session.id]?.length ? (
                        <tr>
                          <td colSpan={9} className="p-0 border-t-0 bg-gray-50">
                            <div className="pl-12 pr-4 py-4">
                              <InterviewsList 
                                interviews={sessionInterviews[session.id]} 
                                refreshInterviews={() => refreshInterviews(session.id)}
                              />
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-0 border-t-0 bg-gray-50">
                            <div className="pl-12 pr-4 py-4">
                              <p className="text-gray-500 text-center">No interviews for this session</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CoordinatePopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)} 
        coordinate={selectedCoordinate}
      />
    </>
  );
};

export default SessionList;
