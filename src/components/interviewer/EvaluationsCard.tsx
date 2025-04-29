
import React from "react";
import { useEvaluations } from "@/hooks/useEvaluations";
import { Star, MessageSquare, Clock, Trash2 } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EvaluationsCardProps {
  interviewerId: string;
  projectNameResolver: (id: string | undefined) => string;
}

const EvaluationsCard: React.FC<EvaluationsCardProps> = ({
  interviewerId,
  projectNameResolver,
}) => {
  const { evaluations, loading, deleteEvaluation } = useEvaluations(interviewerId);
  const { toast } = useToast();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteEvaluation(deleteId);
      toast({
        title: "Evaluation deleted",
        description: "The evaluation has been successfully deleted",
      });
    } catch (error) {
      console.error("Error deleting evaluation:", error);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="text-lg font-semibold">Performance Evaluations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading evaluations...</div>
        ) : evaluations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No evaluations found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <div className="flex mr-2">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < evaluation.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                    </div>
                    {evaluation.project_id && (
                      <Badge variant="outline" className="ml-2">
                        {projectNameResolver(evaluation.project_id)}
                      </Badge>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(evaluation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete evaluation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {evaluation.tags && evaluation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 my-2">
                    {evaluation.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {evaluation.remarks && (
                  <div className="flex items-start mt-2 text-gray-600">
                    <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{evaluation.remarks}</p>
                  </div>
                )}

                <div className="flex items-center mt-3 text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDate(evaluation.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this evaluation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default EvaluationsCard;
