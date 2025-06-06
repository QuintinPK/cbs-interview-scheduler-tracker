
import React from "react";
import { Project, Session, Interviewer, Interview } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCostsCalculator } from "@/hooks/useCostsCalculator";
import InterviewerCostsTable from "./InterviewerCostsTable";
import TotalCostsCard from "./TotalCostsCard";
import { useNavigate } from "react-router-dom";

interface ProjectCostsBreakdownProps {
  project: Project;
  sessions: Session[];
  interviewers: Interviewer[];
  interviews: Interview[];
  loading: boolean;
}

const ProjectCostsBreakdown: React.FC<ProjectCostsBreakdownProps> = ({
  project,
  sessions,
  interviewers,
  interviews,
  loading
}) => {
  const navigate = useNavigate();
  const { calculatedCosts } = useCostsCalculator(
    sessions,
    interviewers,
    interviews,
    project.hourly_rate || 0,
    project.response_rate || 0,
    project.non_response_rate || 0,
    project.show_response_rates || false
  );

  const handleInterviewerClick = (interviewerId: string) => {
    navigate(`/admin/interviewers/${interviewerId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="col-span-full">
          <TotalCostsCard
            totalCost={calculatedCosts.totalCost}
            totalHours={calculatedCosts.totalHours}
            totalResponses={calculatedCosts.totalResponses}
            totalNonResponses={calculatedCosts.totalNonResponses}
            showResponseRates={project.show_response_rates || false}
            showRecalculateButton={false}
          />
        </div>

        <InterviewerCostsTable
          interviewerCosts={calculatedCosts.interviewerCosts}
          loading={loading}
          hourlyRate={project.hourly_rate || 0}
          responseRate={project.response_rate || 0}
          nonResponseRate={project.non_response_rate || 0}
          showResponseRates={project.show_response_rates || false}
          onInterviewerClick={handleInterviewerClick}
        />
      </CardContent>
    </Card>
  );
};

export default ProjectCostsBreakdown;
