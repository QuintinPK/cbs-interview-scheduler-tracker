
import React from "react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { TagSelector } from "./TagSelector";
import { EvaluationTag, Evaluation } from "@/types";
import { Project } from "@/types";

interface EvaluationFormProps {
  projects: Project[];
  tags: EvaluationTag[];
  evaluation?: Evaluation;
  selectedRating: number;
  setSelectedRating: (rating: number) => void;
  selectedTags: EvaluationTag[];
  setSelectedTags: (tags: EvaluationTag[]) => void;
  onSubmit: (data: any) => void;
}

export function EvaluationForm({
  projects,
  tags,
  evaluation,
  selectedRating,
  setSelectedRating,
  selectedTags,
  setSelectedTags,
  onSubmit
}: EvaluationFormProps) {
  const form = useForm({
    defaultValues: {
      rating: evaluation?.rating || 3,
      remarks: evaluation?.remarks || "",
      project_id: evaluation?.project_id || "",
    },
  });

  // Update form when evaluation changes
  React.useEffect(() => {
    if (evaluation) {
      form.reset({
        rating: evaluation.rating,
        remarks: evaluation.remarks || "",
        project_id: evaluation.project_id || "",
      });
    }
  }, [evaluation, form]);

  const handleTagSelection = (tag: EvaluationTag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <Form {...form}>
      <form id="evaluation-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <SelectItem value="no-project">No project</SelectItem>
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

        <TagSelector 
          tags={tags} 
          selectedTags={selectedTags} 
          onSelectTag={handleTagSelection}
          onRemoveTag={(tag) => setSelectedTags(selectedTags.filter(t => t.id !== tag.id))}
        />
      </form>
    </Form>
  );
}
