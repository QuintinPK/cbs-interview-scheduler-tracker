
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useInterviewer } from "@/hooks/useInterviewer";
import { Plus } from "lucide-react";
import RatingStars from "./RatingStars";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import EvaluationDialog from "./EvaluationDialog";

interface EvaluationsCardProps {
  interviewerId: string;
  projectNameResolver: (id: string) => string;
}

const EvaluationsCard: React.FC<EvaluationsCardProps> = ({ interviewerId, projectNameResolver }) => {
  const { evaluations, loading, refresh } = useEvaluations(interviewerId);
  const { interviewer } = useInterviewer(interviewerId);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  if (loading) {
    return (
      <Card className="col-span-1 h-96">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-1/3" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Evaluations</CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Evaluate
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {evaluations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No evaluations yet
          </div>
        ) : (
          evaluations.map(evaluation => (
            <div key={evaluation.id} className="border rounded-md p-4">
              <div className="flex justify-between mb-2">
                <RatingStars rating={evaluation.rating} />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(evaluation.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              
              {evaluation.project_id && (
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground mr-2">Project:</span>
                  <Badge variant="outline">{projectNameResolver(evaluation.project_id)}</Badge>
                </div>
              )}
              
              {evaluation.tags && evaluation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {evaluation.tags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              {evaluation.remarks && (
                <p className="text-sm mt-2">{evaluation.remarks}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
      
      <EvaluationDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        interviewer={interviewer} 
        onSuccess={refresh}
      />
    </Card>
  );
};

export default EvaluationsCard;
