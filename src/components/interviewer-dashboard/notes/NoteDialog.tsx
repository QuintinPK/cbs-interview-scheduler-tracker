
import React, { useEffect } from "react";
import { Note, Project } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  projects: Project[];
  onSave: (note: Partial<Note>) => void;
}

interface NoteFormValues {
  title: string;
  content: string;
  project_id: string | null;
}

export const NoteDialog: React.FC<NoteDialogProps> = ({
  open,
  onOpenChange,
  note,
  projects,
  onSave,
}) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<NoteFormValues>({
    defaultValues: {
      title: "",
      content: "",
      project_id: null
    }
  });
  
  const selectedProject = watch("project_id");
  
  // Reset form when note changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      if (note) {
        reset({
          title: note.title || "",
          content: note.content,
          project_id: note.project_id || "none"
        });
      } else {
        reset({
          title: "",
          content: "",
          project_id: "none"
        });
      }
    }
  }, [note, open, reset]);
  
  const onSubmit = (data: NoteFormValues) => {
    // Convert "none" to null for project_id
    const projectId = data.project_id === "none" ? null : data.project_id;
    
    console.log("Form submission data:", {
      title: data.title.trim() || null,
      content: data.content.trim(),
      project_id: projectId
    });
    
    onSave({
      title: data.title.trim() || null,
      content: data.content.trim(),
      project_id: projectId
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "Add New Note"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Note title"
              {...register("title")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Note Content *</Label>
            <Textarea
              id="content"
              placeholder="Write your note here..."
              className="min-h-[120px]"
              {...register("content", { required: "Note content is required" })}
            />
            {errors.content && (
              <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project">Associated Project (Optional)</Label>
            <Select 
              onValueChange={(value) => setValue("project_id", value)}
              value={selectedProject || "none"}
              defaultValue="none"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : note ? "Update Note" : "Add Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
