
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, BarChart, Star } from "lucide-react";
import { Interviewer } from "@/types";

interface InterviewerActionsProps {
  interviewer: Interviewer;
  onEdit: (interviewer: Interviewer) => void;
  onDelete: (interviewer: Interviewer) => void;
  onSchedule: (interviewer: Interviewer) => void;
  onViewDashboard: (interviewer: Interviewer) => void;
  onEvaluate: (interviewer: Interviewer) => void;
}

const InterviewerActions: React.FC<InterviewerActionsProps> = ({
  interviewer,
  onEdit,
  onDelete,
  onSchedule,
  onViewDashboard,
  onEvaluate,
}) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(interviewer)}
        title="Edit Interviewer"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEvaluate(interviewer)}
        title="Evaluate Interviewer"
      >
        <Star className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSchedule(interviewer)}
        title="Schedule Interviewer"
      >
        <Calendar className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onViewDashboard(interviewer)}
        title="View Dashboard"
      >
        <BarChart className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(interviewer)}
        title="Delete Interviewer"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

export default InterviewerActions;
