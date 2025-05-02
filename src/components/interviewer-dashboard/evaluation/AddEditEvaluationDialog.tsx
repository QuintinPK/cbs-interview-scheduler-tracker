
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEvaluations } from "@/hooks/useEvaluations";
import { Evaluation, EvaluationTag } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { EvaluationForm } from "./EvaluationForm";

interface AddEditEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewerId: string;
  evaluation?: Evaluation;
  onSuccess: () => void;
}

export function AddEditEvaluationDialog({
  open,
  onOpenChange,
  interviewerId,
  evaluation,
  onSuccess
}: AddEditEvaluationDialogProps) {
  const { toast } = useToast();
  const { addEvaluation, loadEvaluationTags, tags } = useEvaluations();
  const { projects } = useProjects();
  const [selectedRating, setSelectedRating] = useState(evaluation?.rating || 3);
  const [selectedTags, setSelectedTags] = useState<EvaluationTag[]>([]);
  const isEditing = Boolean(evaluation);
  
  // Load tags and initialize selected tags if editing
  useEffect(() => {
    loadEvaluationTags();
    
    if (evaluation && evaluation.tags) {
      setSelectedTags(evaluation.tags);
    }
  }, [evaluation, loadEvaluationTags]);

  // Update form when evaluation changes
  useEffect(() => {
    if (evaluation) {
      setSelectedRating(evaluation.rating);
      setSelectedTags(evaluation.tags || []);
    } else {
      setSelectedRating(3);
      setSelectedTags([]);
    }
  }, [evaluation]);

  const onSubmit = async (data: any) => {
    try {
      await addEvaluation({
        interviewer_id: interviewerId,
        rating: selectedRating,
        remarks: data.remarks,
        project_id: data.project_id || undefined,
        tag_ids: selectedTags.map(tag => tag.id),
      });
      
      toast({
        title: isEditing ? "Evaluation updated" : "Evaluation added",
        description: isEditing 
          ? "The evaluation has been successfully updated" 
          : "A new evaluation has been added for this interviewer",
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'add'} evaluation`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Evaluation" : "Add New Evaluation"}
          </DialogTitle>
        </DialogHeader>

        <EvaluationForm
          projects={projects}
          tags={tags}
          evaluation={evaluation}
          selectedRating={selectedRating}
          setSelectedRating={setSelectedRating}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          onSubmit={onSubmit}
        />
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="evaluation-form" onClick={() => {
            const formElement = document.getElementById("evaluation-form");
            if (formElement) {
              formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
          }}>
            {isEditing ? "Update" : "Add"} Evaluation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
