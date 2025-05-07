
import React, { useEffect, useState, useCallback } from "react";
import { Interviewer, Evaluation } from "@/types";
import { useEvaluations } from "@/hooks/useEvaluations";
import { EvaluationCard } from "./evaluation/EvaluationCard";
import { EvaluationItem } from "./evaluation/EvaluationItem";
import { EvaluationHistory } from "./evaluation/EvaluationHistory";
import { AddEditEvaluationDialog } from "./evaluation/AddEditEvaluationDialog";

interface EvaluationsTabProps {
  interviewer: Interviewer | null;
  getProjectName?: (projectId: string | null | undefined) => string;
}

export const EvaluationsTab: React.FC<EvaluationsTabProps> = ({ 
  interviewer,
  getProjectName = (projectId) => projectId ? `Project: ${projectId}` : "No project" 
}) => {
  const { 
    evaluations, 
    loading, 
    loadEvaluationsByInterviewer, 
    getAverageRating, 
    loadEvaluationTags 
  } = useEvaluations();
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | undefined>(undefined);
  const [loadingRating, setLoadingRating] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load evaluations and tags in advance, when component mounts
  useEffect(() => {
    // Pre-load evaluation tags to make add/edit dialog faster
    loadEvaluationTags();
  }, [loadEvaluationTags]);

  // Load evaluations and average rating when interviewer ID changes
  useEffect(() => {
    if (!interviewer?.id) return;
    
    // Load evaluations
    const fetchData = async () => {
      try {
        // First load evaluations
        setLoadingRating(true);
        const loadedEvals = await loadEvaluationsByInterviewer(interviewer.id);
        
        // Only try to get average rating if there are evaluations
        if (loadedEvals && loadedEvals.length > 0) {
          const rating = await getAverageRating(interviewer.id);
          setAverageRating(rating);
        } else {
          // If no evaluations, don't bother calling the average rating function
          setAverageRating(null);
        }
        
        setLoadingRating(false);
        setInitialLoadDone(true);
      } catch (error) {
        console.error("Error loading evaluation data:", error);
        setInitialLoadDone(true);
        setLoadingRating(false);
      }
    };
    
    fetchData();
  }, [interviewer?.id, loadEvaluationsByInterviewer, getAverageRating]);

  const handleAddEvaluation = () => {
    setSelectedEvaluation(undefined);
    setIsAddDialogOpen(true);
  };

  const handleEditEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsEditDialogOpen(true);
  };

  const handleEvaluationSuccess = useCallback(() => {
    if (!interviewer?.id) return;
    
    // Reload evaluations after adding/editing with force refresh
    loadEvaluationsByInterviewer(interviewer.id, true);
    
    // Refresh average rating
    const fetchAverageRating = async () => {
      setLoadingRating(true);
      try {
        const rating = await getAverageRating(interviewer.id, true); // Force refresh
        setAverageRating(rating);
      } catch (error) {
        console.error("Error getting average rating:", error);
      } finally {
        setLoadingRating(false);
      }
    };
    
    fetchAverageRating();
  }, [interviewer?.id, loadEvaluationsByInterviewer, getAverageRating]);

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
      <EvaluationCard
        loading={loading}
        initialLoadDone={initialLoadDone}
        evaluations={evaluations}
        averageRating={averageRating}
        loadingRating={loadingRating}
        onAddEvaluation={handleAddEvaluation}
      >
        {evaluations.map((evaluation) => (
          <EvaluationItem 
            key={evaluation.id}
            evaluation={evaluation}
            onEdit={handleEditEvaluation}
            getProjectName={getProjectName}
          />
        ))}
      </EvaluationCard>
      
      {/* Evaluation History */}
      <EvaluationHistory
        evaluations={evaluations}
        loading={loading}
        initialLoadDone={initialLoadDone}
      />
      
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
