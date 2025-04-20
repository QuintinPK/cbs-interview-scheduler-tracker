
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import { UserX } from "lucide-react";
import { Link } from "react-router-dom";
import { useFilter } from "@/contexts/FilterContext";
import { useProjects } from "@/hooks/useProjects";

interface InactiveInterviewersCardProps {
  sessions: Session[];
  interviewers: Interviewer[];
  loading?: boolean;
}

const InactiveInterviewersCard: React.FC<InactiveInterviewersCardProps> = ({
  sessions,
  interviewers,
  loading = false
}) => {
  const { filterSessions, filterInterviewers, selectedProject } = useFilter();
  const { getInterviewerProjects } = useProjects();
  const [effectiveInterviewers, setEffectiveInterviewers] = useState<Interviewer[]>([]);
  const [inactiveInterviewers, setInactiveInterviewers] = useState<Interviewer[]>([]);
  const [processingData, setProcessingData] = useState(true);
  
  // Apply global filters
  const filteredSessions = filterSessions(sessions);
  const filteredInterviewers = filterInterviewers(interviewers);
  
  // Further filter interviewers by project if a project is selected
  useEffect(() => {
    const filterByProject = async () => {
      if (selectedProject) {
        const filtered = [];
        
        for (const interviewer of filteredInterviewers) {
          const projects = await getInterviewerProjects(interviewer.id);
          if (projects.some(p => p.id === selectedProject.id)) {
            filtered.push(interviewer);
          }
        }
        
        setEffectiveInterviewers(filtered);
      } else {
        setEffectiveInterviewers(filteredInterviewers);
      }
      
      setProcessingData(false);
    };
    
    filterByProject();
  }, [filteredInterviewers, selectedProject, getInterviewerProjects]);
  
  // Calculate inactive interviewers
  useEffect(() => {
    // Calculate start of this week (Sunday)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Find active interviewer IDs this week from filtered sessions
    const activeInterviewerIds = new Set(
      filteredSessions
        .filter(session => new Date(session.start_time) >= startOfWeek)
        .map(session => session.interviewer_id)
    );
    
    // Get interviewers who haven't been active this week from filtered interviewers
    const inactive = effectiveInterviewers.filter(
      interviewer => !activeInterviewerIds.has(interviewer.id)
    );
    
    setInactiveInterviewers(inactive);
  }, [effectiveInterviewers, filteredSessions]);
  
  // Combine loading states
  const isLoading = loading || processingData;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <UserX className="h-5 w-5 mr-2 text-amber-500" />
          <span>Interviewers Inactive This Week</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : inactiveInterviewers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">All interviewers have been active this week</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inactiveInterviewers.map((interviewer) => (
              <Link 
                key={interviewer.id} 
                to={`/admin/interviewer/${interviewer.id}`}
                className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <p className="font-medium">{interviewer.code}</p>
                <p className="text-sm text-muted-foreground">
                  {interviewer.first_name} {interviewer.last_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {interviewer.email}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InactiveInterviewersCard;
