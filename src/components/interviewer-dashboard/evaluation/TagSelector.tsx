
import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { EvaluationTag } from "@/types";
import { FormLabel } from "@/components/ui/form";

interface TagSelectorProps {
  tags: EvaluationTag[];
  selectedTags: EvaluationTag[];
  onSelectTag: (tag: EvaluationTag) => void;
  onRemoveTag: (tag: EvaluationTag) => void;
}

export function TagSelector({
  tags,
  selectedTags,
  onSelectTag,
  onRemoveTag
}: TagSelectorProps) {
  // Group tags by category for display
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

  return (
    <div className="space-y-2">
      <FormLabel>Tags (optional)</FormLabel>
      
      {/* Display tags grouped by category */}
      {Object.entries(groupedTags).map(([category, categoryTags]) => (
        <div key={category} className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground mb-1">{category}</div>
          <div className="flex flex-wrap gap-2">
            {categoryTags.map(tag => (
              <Badge 
                key={tag.id}
                variant={selectedTags.some(t => t.id === tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onSelectTag(tag)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
      
      {/* Display selected tags */}
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
                  onClick={() => onRemoveTag(tag)}
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
  );
}
