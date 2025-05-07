
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Interviewer } from "@/types";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewer: Interviewer | null;
  submitting: boolean;
  onConfirmDelete: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onOpenChange,
  interviewer,
  submitting,
  onConfirmDelete
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-medium">
              {interviewer ? `${interviewer.first_name} ${interviewer.last_name}` : ''}
            </span>
            ?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This action cannot be undone. All sessions associated with this interviewer will also be deleted.
          </p>
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
            variant="destructive" 
            onClick={onConfirmDelete}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
