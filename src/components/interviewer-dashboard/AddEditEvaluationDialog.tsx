
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useEvaluations } from "@/hooks/useEvaluations";
import { Evaluation, EvaluationTag } from "@/types";
import { useProjects } from "@/hooks/useProjects";

interface AddEditEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewerId: string;
  evaluation?: Evaluation;
  onSuccess: () => void;
}

type FormValues = {
  rating: number;
  remarks: string;
  project_id: string;
  tag_ids: string[];
};

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
  
  const form = useForm<FormValues>({
    defaultValues: {
      rating: evaluation?.rating || 3,
      remarks: evaluation?.remarks || "",
      project_id: evaluation?.project_id || "",
      tag_ids: [],
    },
  });

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
      form.reset({
        rating: evaluation.rating,
        remarks: evaluation.remarks || "",
        project_id: evaluation.project_id || "",
        tag_ids: evaluation.tags?.map(tag => tag.id) || [],
      });
      setSelectedRating(evaluation.rating);
      setSelectedTags(evaluation.tags || []);
    } else {
      form.reset({
        rating: 3,
        remarks: "",
        project_id: "",
        tag_ids: [],
      });
      setSelectedRating(3);
      setSelectedTags([]);
    }
  }, [evaluation, form]);

  const onSubmit = async (data: FormValues) => {
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

  const groupedTags = React.useMemo(() => {
    const grouped: Record<string, EvaluationTag[]> = {};
    
    tags.forEach(tag => {
      if (!grouped[tag.category]) {
        grouped[tag.category] = [];
      }
      grouped[tag.category].push(tag);
    });
    
    return grouped;
  }, [tags]);

  const handleTagSelection = (tag: EvaluationTag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <div className="flex items-center">
                <StarRating 
                  rating={selectedRating} 
                  onRate={setSelectedRating} 
                  size={28}
                />
                <span className="ml-2 text-sm text-muted-foreground">
                  {selectedRating}/5
                </span>
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project (optional)</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add comments about the interviewer's performance..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Tags (optional)</FormLabel>
              
              {Object.entries(groupedTags).map(([category, categoryTags]) => (
                <div key={category} className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{category}</div>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map(tag => (
                      <Badge 
                        key={tag.id}
                        variant={selectedTags.some(t => t.id === tag.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTagSelection(tag)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              
              {selectedTags.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Selected tags</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tag => (
                      <Badge 
                        key={tag.id} 
                        className="pl-2 pr-1 py-0 h-6 gap-1 flex items-center"
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => setSelectedTags(selectedTags.filter(t => t.id !== tag.id))}
                          className="rounded-full hover:bg-primary/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update" : "Add"} Evaluation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
