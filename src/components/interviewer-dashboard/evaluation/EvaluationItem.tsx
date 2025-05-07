
import React, { useCallback } from "react";
import { format } from "date-fns";
import { Evaluation } from "@/types";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface EvaluationItemProps {
  evaluation: Evaluation;
  onEdit: (evaluation: Evaluation) => void;
  getProjectName?: (projectId: string | null | undefined) => string;
}

export const EvaluationItem: React.FC<EvaluationItemProps> = ({
  evaluation,
  onEdit,
  getProjectName = (projectId) => projectId ? `Project: ${projectId}` : "No project",
}) => {
  const groupEvaluationTags = useCallback((evaluation: Evaluation) => {
    if (!evaluation.tags) return {};
    
    const grouped: Record<string, any[]> = {};
    evaluation.tags.forEach(tag => {
      if (!grouped[tag.category]) {
        grouped[tag.category] = [];
      }
      grouped[tag.category].push(tag);
    });
    
    return grouped;
  }, []);

  return (
    <div className="py-4 space-y-3">
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
            onClick={() => onEdit(evaluation)}
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
  );
};
