
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Interviewer, Evaluation } from "@/types";
import { useEvaluations } from "@/hooks/useEvaluations";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface EvaluationsCardProps {
  interviewer: Interviewer;
  projectNameResolver: (id: string | null | undefined) => string;
}

const EvaluationsCard = ({ 
  interviewer,
  projectNameResolver 
}: EvaluationsCardProps) => {
  const { evaluations, loading, loadEvaluationsByInterviewer } = useEvaluations();
  const [localLoading, setLocalLoading] = useState(true);
  
  useEffect(() => {
    console.log("EvaluationsCard: Loading evaluations for interviewer:", interviewer.id);
    
    const loadData = async () => {
      setLocalLoading(true);
      try {
        const data = await loadEvaluationsByInterviewer(interviewer.id);
        console.log("EvaluationsCard: Loaded", data ? data.length : 0, "evaluations");
      } catch (error) {
        console.error("EvaluationsCard: Error loading evaluations", error);
      } finally {
        setLocalLoading(false);
      }
    };
    
    loadData();
  }, [interviewer.id, loadEvaluationsByInterviewer]);
  
  const isLoading = loading || localLoading;
  
  console.log("EvaluationsCard: Render with", evaluations.length, "evaluations, loading:", isLoading);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluations</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-cbs" />
        </CardContent>
      </Card>
    );
  }
  
  if (!evaluations.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            No evaluations yet.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluations ({evaluations.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {evaluations.map((evaluation) => (
              <div 
                key={evaluation.id}
                className="border rounded-md p-4 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <StarRating rating={evaluation.rating} readOnly size={18} />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(evaluation.created_at), "PPP")}
                  </span>
                </div>
                
                {evaluation.project_id && (
                  <div className="text-sm">
                    <span className="font-medium">Project:</span>{" "}
                    {projectNameResolver(evaluation.project_id)}
                  </div>
                )}
                
                {evaluation.remarks && (
                  <div>
                    <p className="text-sm text-gray-700">{evaluation.remarks}</p>
                  </div>
                )}
                
                {evaluation.tags && Array.isArray(evaluation.tags) && evaluation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {evaluation.tags.map(tag => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EvaluationsCard;
