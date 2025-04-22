
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDataFetching } from "@/hooks/useDataFetching";
import { supabase } from "@/integrations/supabase/client";
import { Interview, Project } from "@/types";
import GlobalFilter from "@/components/GlobalFilter";
import ProjectCostsBreakdown from "@/components/costs/ProjectCostsBreakdown";

const Costs = () => {
  const { sessions, interviewers, projects, loading: dataLoading } = useDataFetching();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

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

  const isLoading = dataLoading || loadingInterviews;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cbs to-cbs-light bg-clip-text text-transparent">Project Costs</h1>
          
          <GlobalFilter />
        </div>

        <div className="grid gap-6">
          {projects.length > 0 ? (
            projects.map(project => (
              <ProjectCostsBreakdown
                key={project.id}
                project={project}
                sessions={sessions.filter(s => s.project_id === project.id)}
                interviewers={interviewers}
                interviews={interviews.filter(i => i.project_id === project.id)}
                loading={isLoading}
              />
            ))
          ) : !isLoading ? (
            <Alert>
              <AlertTitle>No projects found</AlertTitle>
              <AlertDescription>
                {projects.length === 0 
                  ? "Create a project to start tracking costs." 
                  : "No projects match your current filters."}
              </AlertDescription>
            </Alert>
          ) : null}
          
          {isLoading && (
            <div className="py-8 text-center text-muted-foreground">
              Loading cost data...
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Costs;
