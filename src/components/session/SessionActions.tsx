
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, StopCircle, Trash2 } from "lucide-react";
import { Session } from "@/types";

interface SessionActionsProps {
  session: Session;
  loading: boolean;
  onEdit: (session: Session) => void;
  onStop: (session: Session) => void;
  onDelete: (session: Session) => void;
}

export const SessionActions: React.FC<SessionActionsProps> = ({
  session,
  loading,
  onEdit,
  onStop,
  onDelete,
}) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(session)}
        title="Edit"
        disabled={loading}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      
      {session.is_active && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onStop(session)}
          title="Stop Session"
          disabled={loading}
        >
          <StopCircle className="h-4 w-4" />
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(session)}
        title="Delete"
        disabled={loading}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};
