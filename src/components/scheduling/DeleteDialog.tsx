
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Schedule } from "@/types";
import { Interviewer } from "@/types";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSchedule: Schedule | null;
  interviewers: Interviewer[];
  onConfirmDelete: () => Promise<void>;
}

export const DeleteDialog = ({
  open,
  onOpenChange,
  selectedSchedule,
  interviewers,
  onConfirmDelete,
}: DeleteDialogProps) => {
  const interviewer = selectedSchedule 
    ? interviewers.find(i => i.id === selectedSchedule.interviewer_id) 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p>
            Are you sure you want to delete this schedule for{" "}
            {interviewer?.first_name}{" "}
            {interviewer?.last_name}?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This action cannot be undone.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
