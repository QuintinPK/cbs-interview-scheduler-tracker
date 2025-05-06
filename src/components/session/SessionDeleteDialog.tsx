
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Session } from "@/types";

interface SessionDeleteDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  selectedSession: Session | null;
  submitting: boolean;
  confirmDelete: () => Promise<void>;
  getInterviewerCode: (id: string) => string;
}

const SessionDeleteDialog: React.FC<SessionDeleteDialogProps> = ({
  showDialog,
  setShowDialog,
  selectedSession,
  submitting,
  confirmDelete,
  getInterviewerCode
}) => {
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p>Are you sure you want to delete this session for {selectedSession ? getInterviewerCode(selectedSession.interviewer_id) : ''}?</p>
          <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowDialog(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={confirmDelete}
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

export default SessionDeleteDialog;
