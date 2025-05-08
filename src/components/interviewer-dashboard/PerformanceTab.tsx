
import React from "react";
import { PerformanceMetrics } from "@/components/interviewer-dashboard/PerformanceMetrics";
import { Session, Interviewer } from "@/types";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PerformanceTabProps {
  sessions: Session[];
  interviews: any[];
  interviewer: Interviewer | null;
  getProjectName: (projectId: string | null | undefined) => string;
  compareInterviewer?: Interviewer | null;
  compareSessions?: Session[];
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ 
  sessions, 
  interviews, 
  interviewer,
  getProjectName,
  compareInterviewer,
  compareSessions = []
}) => {
  const navigate = useNavigate();
  const { interviewerId } = useParams<{ interviewerId: string }>();
  const [searchParams] = useSearchParams();
  const compareId = searchParams.get('compare');
  
  const handleCompare = (compareId: string) => {
    if (interviewerId) {
      navigate(`/admin/interviewer/${interviewerId}?compare=${compareId}`);
    }
  };
  
  const handleClearCompare = () => {
    if (interviewerId) {
      navigate(`/admin/interviewer/${interviewerId}`);
    }
  };
  
  return (
    <>
      {compareInterviewer ? (
        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Comparing: {interviewer?.first_name} {interviewer?.last_name} with {compareInterviewer.first_name} {compareInterviewer.last_name}
                </CardTitle>
                <button 
                  onClick={handleClearCompare}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear comparison
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">{interviewer?.first_name} {interviewer?.last_name}</h3>
                  <PerformanceMetrics
                    sessions={sessions}
                    interviews={interviews}
                    interviewer={interviewer}
                    allInterviewersSessions={[]}
                    onCompare={handleCompare}
                    showComparisonSelector={false}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{compareInterviewer.first_name} {compareInterviewer.last_name}</h3>
                  <PerformanceMetrics
                    sessions={compareSessions}
                    interviews={[]} 
                    interviewer={compareInterviewer}
                    allInterviewersSessions={[]}
                    showComparisonSelector={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <PerformanceMetrics
          sessions={sessions}
          interviews={interviews}
          interviewer={interviewer}
          allInterviewersSessions={[]}
          onCompare={handleCompare}
          showComparisonSelector={true}
        />
      )}
    </>
  );
};
