
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Interviewer, Project, Session, EvaluationTag } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useEvaluations } from "@/hooks/useEvaluations";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EvaluationDialogProps {
  interviewer: Interviewer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  sessions?: Session[];
}

const EvaluationDialog = ({
  interviewer,
  open,
  onOpenChange,
  projects,
  sessions
}: EvaluationDialogProps) => {
  const { toast } = useToast();
  const { loadEvaluationTags, addEvaluation, tags, loading, saving } = useEvaluations();
  
  const [rating, setRating] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [tagsByCategory, setTagsByCategory] = useState<Record<string, EvaluationTag[]>>({});

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

  // Reset form state when dialog opens
  useEffect(() => {
    if (open) {
      setRating(0);
      setRemarks("");
      setSelectedTags([]);
      setSelectedProject(undefined);
    }
  }, [open]);

  // Organize tags by category
  useEffect(() => {
    if (tags.length > 0) {
      const categorized: Record<string, EvaluationTag[]> = {};
      tags.forEach(tag => {
        if (!categorized[tag.category]) {
          categorized[tag.category] = [];
        }
        categorized[tag.category].push(tag);
      });
      setTagsByCategory(categorized);
    } else {
      setTagsByCategory({});
    }
  }, [tags]);

  const handleSubmit = async () => {
    if (!interviewer) return;
    
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please provide a rating",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Submitting evaluation:", {
        interviewer_id: interviewer.id,
        project_id: selectedProject,
        rating,
        remarks,
        tag_ids: selectedTags.length > 0 ? selectedTags : undefined
      });
      
      await addEvaluation({
        interviewer_id: interviewer.id,
        project_id: selectedProject,
        rating,
        remarks,
        tag_ids: selectedTags.length > 0 ? selectedTags : undefined
      });
      
      console.log("Evaluation submitted successfully");
      
      toast({
        title: "Evaluation submitted",
        description: `Successfully evaluated ${interviewer.first_name} ${interviewer.last_name}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast({
        title: "Error",
        description: "Failed to submit evaluation",
        variant: "destructive",
      });
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {interviewer ? `Evaluate ${interviewer.first_name} ${interviewer.last_name}` : "Evaluate Interviewer"}
          </DialogTitle>
        </DialogHeader>
        
        {(loading && !tagsLoaded) ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 my-2">
            <div>
              <Label className="mb-2 block">Rating</Label>
              <StarRating 
                rating={rating} 
                onRate={setRating} 
                size={32}
                className="justify-center md:justify-start"
              />
            </div>
            
            {projects.length > 0 && (
              <div>
                <Label htmlFor="project" className="mb-2 block">Project (Optional)</Label>
                <select
                  id="project"
                  className="w-full p-2 border rounded"
                  value={selectedProject || ""}
                  onChange={(e) => setSelectedProject(e.target.value || undefined)}
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <Label htmlFor="remarks" className="mb-2 block">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Add your comments here..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            {Object.keys(tagsByCategory).length > 0 && (
              <div>
                <Label className="mb-2 block">Feedback Tags</Label>
                <ScrollArea className="h-[200px] border rounded p-4">
                  <div className="space-y-4">
                    {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">{category}</h4>
                        <div className="space-y-2 pl-2">
                          {categoryTags.map(tag => (
                            <div key={tag.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag.id}`}
                                checked={selectedTags.includes(tag.id)}
                                onCheckedChange={() => handleTagToggle(tag.id)}
                              />
                              <Label
                                htmlFor={`tag-${tag.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {tag.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={saving || (loading && !tagsLoaded) || rating === 0}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : "Submit Evaluation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationDialog;
