
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface InterviewEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  isSubmitting: boolean;
  editingInterview: {
    result: string | null;
  };
  setEditingInterview: React.Dispatch<React.SetStateAction<{
    result: string | null;
  }>>;
}

export const InterviewEditDialog: React.FC<InterviewEditDialogProps> = ({
  open,
  onClose,
  onSave,
  isSubmitting,
  editingInterview,
  setEditingInterview,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Interview Result</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="result">Result</Label>
            <div className="flex gap-2">
              <Button
                variant={editingInterview.result === 'response' ? 'default' : 'outline'}
                className={editingInterview.result === 'response' ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setEditingInterview({ ...editingInterview, result: 'response' })}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Response
              </Button>
              <Button
                variant={editingInterview.result === 'non-response' ? 'default' : 'outline'}
                className={editingInterview.result === 'non-response' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={() => setEditingInterview({ ...editingInterview, result: 'non-response' })}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Non-response
              </Button>
              <Button
                variant={editingInterview.result === null ? 'default' : 'outline'}
                onClick={() => setEditingInterview({ ...editingInterview, result: null })}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewEditDialog;
