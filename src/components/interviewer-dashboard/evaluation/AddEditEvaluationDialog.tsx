
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEvaluations } from "@/hooks/useEvaluations";
import { Evaluation, EvaluationTag } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { EvaluationForm } from "./EvaluationForm";
import { Loader2 } from "lucide-react";

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
  const { addEvaluation, updateEvaluation, loadEvaluationTags, tags, loading, saving } = useEvaluations();
  const { projects } = useProjects();
  const [selectedRating, setSelectedRating] = useState(evaluation?.rating || 3);
  const [selectedTags, setSelectedTags] = useState<EvaluationTag[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const isEditing = Boolean(evaluation);
  
  // Load tags when dialog opens
  useEffect(() => {
    if (open && !tagsLoaded) {
      const fetchTags = async () => {
        await loadEvaluationTags();
        setTagsLoaded(true);
      };
      fetchTags();
    }

    if (!open) {
      setTagsLoaded(false);
    }
  }, [open, loadEvaluationTags, tagsLoaded]);
  
  // Initialize selected tags if editing
  useEffect(() => {
    if (evaluation && evaluation.tags) {
      setSelectedTags(evaluation.tags);
    } else {
      setSelectedTags([]);
    }
  }, [evaluation]);

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
      if (isEditing && evaluation) {
        await updateEvaluation(evaluation.id, {
          rating: selectedRating,
          remarks: data.remarks,
          project_id: data.project_id || undefined,
          tag_ids: selectedTags.map(tag => tag.id),
        });
      } else {
        await addEvaluation({
          interviewer_id: interviewerId,
          rating: selectedRating,
          remarks: data.remarks,
          project_id: data.project_id || undefined,
          tag_ids: selectedTags.map(tag => tag.id),
        });
      }
      
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

        {(loading && !tagsLoaded) ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
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
        )}
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="evaluation-form" 
            disabled={saving || (loading && !tagsLoaded)}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Adding..."}
              </>
            ) : isEditing ? "Update Evaluation" : "Add Evaluation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
