
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface InterviewResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: 'response' | 'non-response') => void;
  isSubmitting: boolean;
}

const InterviewResultDialog: React.FC<InterviewResultDialogProps> = ({
  isOpen,
  onClose,
  onSelectResult,
  isSubmitting
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Interview Result</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center mb-6">What was the result of the interview?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex items-center justify-center gap-2 p-6 hover:bg-green-50"
              onClick={() => onSelectResult('response')}
              disabled={isSubmitting}
            >
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span className="font-medium">Response</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="flex items-center justify-center gap-2 p-6 hover:bg-red-50"
              onClick={() => onSelectResult('non-response')}
              disabled={isSubmitting}
            >
              <XCircle className="h-6 w-6 text-red-500" />
              <span className="font-medium">Non-response</span>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewResultDialog;
