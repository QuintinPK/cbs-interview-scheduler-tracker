
import React, { useState, useEffect } from "react";
import { Interviewer, Project, EvaluationTag } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { useSessions } from "@/hooks/useSessions";
import { useEvaluations } from "@/hooks/useEvaluations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface EvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewer: Interviewer | null;
  onSuccess?: () => void;
}

const EvaluationDialog: React.FC<EvaluationDialogProps> = ({
  open,
  onOpenChange,
  interviewer,
  onSuccess
}) => {
  const { projects, loading: projectsLoading } = useProjects();
  const { sessions, loading: sessionsLoading } = useSessions();
  const { evaluationTags, loading: tagsLoading, addEvaluation } = useEvaluations();
  
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedSession, setSelectedSession] = useState<string | undefined>(undefined);
  const [rating, setRating] = useState<number>(5);
  const [remarks, setRemarks] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (open) {
      setSelectedProject(undefined);
      setSelectedSession(undefined);
      setRating(5);
      setRemarks("");
      setSelectedTags([]);
    }
  }, [open]);
  
  const interviewerSessions = interviewer 
    ? sessions.filter(session => session.interviewer_id === interviewer.id)
    : [];
  
  const filteredSessions = selectedProject 
    ? interviewerSessions.filter(session => session.project_id === selectedProject)
    : interviewerSessions;
  
  const tagsByCategory = evaluationTags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, EvaluationTag[]>);
  
  const handleSubmit = async () => {
    if (!interviewer) return;
    
    try {
      setSubmitting(true);
      
      await addEvaluation(
        {
          interviewer_id: interviewer.id,
          project_id: selectedProject,
          session_id: selectedSession,
          rating,
          remarks: remarks.trim() || undefined,
          created_by: "admin" // Replace with actual user if authentication is implemented
        },
        selectedTags
      );
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting evaluation:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prevTags =>
      prevTags.includes(tagId)
        ? prevTags.filter(id => id !== tagId)
        : [...prevTags, tagId]
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {interviewer ? `Evaluate ${interviewer.first_name} ${interviewer.last_name}` : "Evaluate Interviewer"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project (optional)</label>
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
              disabled={projectsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific project</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Session (optional)</label>
            <Select
              value={selectedSession}
              onValueChange={setSelectedSession}
              disabled={sessionsLoading || filteredSessions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific session</SelectItem>
                {filteredSessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {new Date(session.start_time).toLocaleDateString()} - {
                      projects.find(p => p.id === session.project_id)?.name || "No project"
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Button
                  key={star}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`p-1 ${rating >= star ? "text-yellow-500" : "text-gray-300"}`}
                  onClick={() => setRating(star)}
                >
                  <Star className="h-6 w-6 fill-current" />
                </Button>
              ))}
            </div>
          </div>
          
          {!tagsLoading && Object.keys(tagsByCategory).length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback Tags</label>
              <div className="space-y-3">
                {Object.entries(tagsByCategory).map(([category, tags]) => (
                  <div key={category} className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks (optional)</label>
            <Textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Add any comments or feedback..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Evaluation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationDialog;
