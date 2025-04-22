import React, { useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useCostsCalculator } from "@/hooks/useCostsCalculator";
import HourlyRateCard from "@/components/costs/HourlyRateCard";
import TotalCostsCard from "@/components/costs/TotalCostsCard";
import ProjectCostsBreakdown from "@/components/costs/ProjectCostsBreakdown";
import { supabase } from "@/integrations/supabase/client";
import { Interview, Project } from "@/types";

const Costs = () => {
  const { sessions, interviewers, projects, loading: dataLoading } = useDataFetching();
  const [interviews, setInterviews] = React.useState<Interview[]>([]);
  const [loadingInterviews, setLoadingInterviews] = React.useState(true);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoadingInterviews(true);
        const { data, error } = await supabase
          .from('interviews')
          .select('*');
          
        if (error) throw error;
        
        const typedInterviews = data?.map(interview => ({
          ...interview,
          result: interview.result === 'response' || interview.result === 'non-response' 
            ? interview.result 
            : interview.result
        })) as Interview[] || [];
        
        setInterviews(typedInterviews);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoadingInterviews(false);
      }
    };
    
    fetchInterviews();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Project Costs</h1>
        </div>

        <div className="grid gap-6">
          {projects.map(project => (
            <ProjectCostsBreakdown
              key={project.id}
              project={project}
              sessions={sessions.filter(s => s.project_id === project.id)}
              interviewers={interviewers}
              interviews={interviews.filter(i => i.project_id === project.id)}
              loading={dataLoading || loadingInterviews}
            />
          ))}
          
          {projects.length === 0 && !dataLoading && (
            <Alert>
              <AlertTitle>No projects found</AlertTitle>
              <AlertDescription>
                Create a project to start tracking costs.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Costs;
