import React, { useEffect, useState } from "react";
import { Interviewer, Evaluation } from "@/types";
import { useEvaluations } from "@/hooks/useEvaluations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { Loader2, FileBadge, Star, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { AddEditEvaluationDialog } from "./evaluation/AddEditEvaluationDialog";

interface EvaluationsTabProps {
  interviewer: Interviewer | null;
  getProjectName?: (projectId: string | null | undefined) => string;
}

export const EvaluationsTab: React.FC<EvaluationsTabProps> = ({ 
  interviewer,
  getProjectName = (projectId) => projectId ? `Project: ${projectId}` : "No project" 
}) => {
  const { evaluations, loading, loadEvaluationsByInterviewer, getAverageRating } = useEvaluations();
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | undefined>(undefined);

  useEffect(() => {
    if (interviewer?.id) {
      loadEvaluationsByInterviewer(interviewer.id);
      
      // Load average rating
      const fetchAverageRating = async () => {
        const rating = await getAverageRating(interviewer.id);
        setAverageRating(rating);
      };
      
      fetchAverageRating();
    }
  }, [interviewer?.id, loadEvaluationsByInterviewer, getAverageRating]);

  // Group evaluations by category for display
  const groupEvaluationTags = (evaluation: Evaluation) => {
    if (!evaluation.tags) return {};
    
    const grouped: Record<string, any[]> = {};
    evaluation.tags.forEach(tag => {
      if (!grouped[tag.category]) {
        grouped[tag.category] = [];
      }
      grouped[tag.category].push(tag);
    });
    
    return grouped;
  };

  const handleAddEvaluation = () => {
    setSelectedEvaluation(undefined);
    setIsAddDialogOpen(true);
  };

  const handleEditEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsEditDialogOpen(true);
  };

  const handleEvaluationSuccess = () => {
    if (interviewer?.id) {
      loadEvaluationsByInterviewer(interviewer.id);
      
      // Refresh average rating
      const fetchAverageRating = async () => {
        const rating = await getAverageRating(interviewer.id);
        setAverageRating(rating);
      };
      
      fetchAverageRating();
    }
  };

  if (!interviewer) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center text-muted-foreground">
        Interviewer data is loading or not available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evaluations Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-semibold">
            <div className="flex items-center gap-2">
              <FileBadge className="h-5 w-5 text-primary" />
              Interviewer Evaluations
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-4">
            {averageRating !== null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Average Rating:</span>
                <div className="flex items-center">
                  <StarRating rating={averageRating} readOnly size={18} />
                  <span className="ml-2 font-semibold">{averageRating}</span>
                </div>
              </div>
            )}
            
            <Button 
              size="sm" 
              onClick={handleAddEvaluation}
              className="ml-2"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Evaluation
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-10 border-t">
              <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground">No evaluations have been recorded for this interviewer yet.</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Evaluations help measure interviewer performance and identify areas for improvement.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {evaluations.map((evaluation) => (
                <div key={evaluation.id} className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StarRating rating={evaluation.rating} readOnly size={16} />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(evaluation.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {evaluation.project_id && (
                        <Badge variant="outline">
                          {getProjectName(evaluation.project_id)}
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleEditEvaluation(evaluation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {evaluation.remarks && (
                    <p className="text-sm border-l-2 border-primary/30 pl-3 py-1 bg-primary/5 rounded">
                      {evaluation.remarks}
                    </p>
                  )}
                  
                  {evaluation.tags && evaluation.tags.length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(groupEvaluationTags(evaluation)).map(([category, tags]) => (
                        <div key={category} className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">{category}</div>
                          <div className="flex flex-wrap gap-1">
                            {tags.map(tag => (
                              <Badge key={tag.id} variant="secondary" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Evaluation History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Evaluation History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : evaluations.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              
              {evaluations.map((evaluation) => (
                <div key={evaluation.id} className="relative pl-10 pb-8">
                  <div className="absolute left-[15px] -translate-x-1/2 bg-background border-4 border-white rounded-full">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Star className="h-3 w-3 text-primary/70" />
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <p className="font-medium mb-1">
                      {format(new Date(evaluation.created_at), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-muted-foreground">
                      Rating: <span className="font-medium">{evaluation.rating}/5</span>
                    </p>
                    {evaluation.remarks && (
                      <p className="text-muted-foreground mt-2">"{evaluation.remarks}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No evaluation history available
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <AddEditEvaluationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        interviewerId={interviewer.id}
        onSuccess={handleEvaluationSuccess}
      />
      
      {selectedEvaluation && (
        <AddEditEvaluationDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          interviewerId={interviewer.id}
          evaluation={selectedEvaluation}
          onSuccess={handleEvaluationSuccess}
        />
      )}
    </div>
  );
};
