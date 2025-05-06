
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface InterviewResultDialogProps {
  open: boolean;
  onClose: () => void;
  onSetResult: (result: 'response' | 'non-response') => Promise<void>;
  isSubmitting: boolean;
}

export const InterviewResultDialog: React.FC<InterviewResultDialogProps> = ({
  open,
  onClose,
  onSetResult,
  isSubmitting,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Interview Result</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">Please select the outcome of this interview:</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => onSetResult('response')}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Response
            </Button>
            <Button
              onClick={() => onSetResult('non-response')}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Non-response
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewResultDialog;
