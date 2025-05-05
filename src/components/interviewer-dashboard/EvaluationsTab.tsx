
import React, { useEffect, useState, useCallback } from "react";
import { Interviewer, Evaluation } from "@/types";
import { useEvaluations } from "@/hooks/useEvaluations";
import { AddEditEvaluationDialog } from "./evaluation/AddEditEvaluationDialog";
import { EvaluationCard } from "./evaluation/EvaluationCard";
import { EvaluationHistory } from "./evaluation/EvaluationHistory";

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

  console.log("EvaluationsTab rendered with interviewer:", interviewer?.id);
  console.log("Current evaluations:", evaluations);

  // Load evaluations and tags in advance, when component mounts
  useEffect(() => {
    // Pre-load evaluation tags to make add/edit dialog faster
    loadEvaluationTags();
  }, [loadEvaluationTags]);

  // Load evaluations and average rating when interviewer ID changes
  useEffect(() => {
    if (!interviewer?.id) {
      console.log("No interviewer ID available, skipping evaluation loading");
      return;
    }
    
    console.log("Loading evaluations for interviewer:", interviewer.id);
    
    // Load evaluations
    const fetchData = async () => {
      try {
        const loadedEvaluations = await loadEvaluationsByInterviewer(interviewer.id);
        console.log("Loaded evaluations result:", loadedEvaluations);
        
        // Load average rating
        setLoadingRating(true);
        const rating = await getAverageRating(interviewer.id);
        console.log("Loaded average rating:", rating);
        setAverageRating(rating);
        setLoadingRating(false);
        
        setInitialLoadDone(true);
      } catch (error) {
        console.error("Error loading evaluation data:", error);
        setInitialLoadDone(true);
      }
    };
    
    fetchData();
  }, [interviewer?.id, loadEvaluationsByInterviewer, getAverageRating]);

  // Group evaluations by category for display
  const groupEvaluationTags = useCallback((evaluation: Evaluation) => {
    if (!evaluation.tags || !Array.isArray(evaluation.tags)) {
      console.log("No tags array found for evaluation:", evaluation.id);
      return {};
    }
    
    const grouped: Record<string, any[]> = {};
    evaluation.tags.forEach(tag => {
      if (!tag.category) {
        console.log("Tag missing category:", tag);
        return;
      }
      
      if (!grouped[tag.category]) {
        grouped[tag.category] = [];
      }
      grouped[tag.category].push(tag);
    });
    
    return grouped;
  }, []);

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
    
    console.log("Evaluation saved, reloading data");
    
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
        evaluations={evaluations}
        loading={loading}
        initialLoadDone={initialLoadDone}
        averageRating={averageRating}
        loadingRating={loadingRating}
        onAddEvaluation={handleAddEvaluation}
        onEditEvaluation={handleEditEvaluation}
        groupEvaluationTags={groupEvaluationTags}
        getProjectName={getProjectName}
      />
      
      {/* Evaluation History Card */}
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
