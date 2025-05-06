
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn, formatDateTime } from "@/lib/utils";
import { Session } from "@/types";

interface SessionEditDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  selectedSession: Session | null;
  editEndDate: Date | undefined;
  setEditEndDate: (date: Date | undefined) => void;
  editEndTime: string;
  setEditEndTime: (time: string) => void;
  editLocation: {
    latitude: string;
    longitude: string;
  };
  setEditLocation: (location: { latitude: string; longitude: string }) => void;
  submitting: boolean;
  confirmEdit: () => Promise<void>;
  getInterviewerCode: (id: string) => string;
}

const SessionEditDialog: React.FC<SessionEditDialogProps> = ({
  showDialog,
  setShowDialog,
  selectedSession,
  editEndDate,
  setEditEndDate,
  editEndTime,
  setEditEndTime,
  editLocation,
  setEditLocation,
  submitting,
  confirmEdit,
  getInterviewerCode
}) => {
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Interviewer Code</Label>
            <Input 
              value={selectedSession ? getInterviewerCode(selectedSession.interviewer_id) : ""} 
              disabled 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Start Date/Time</Label>
            <Input 
              value={selectedSession ? formatDateTime(selectedSession.start_time) : ""} 
              disabled 
            />
          </div>
          
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !editEndDate && "text-muted-foreground"
                  )}
                  disabled={submitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editEndDate ? format(editEndDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto">
                <Calendar
                  mode="single"
                  selected={editEndDate}
                  onSelect={setEditEndDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              disabled={submitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label>End Location (Latitude, Longitude)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Latitude"
                value={editLocation.latitude}
                onChange={(e) => setEditLocation({ ...editLocation, latitude: e.target.value })}
                disabled={submitting}
              />
              <Input
                placeholder="Longitude"
                value={editLocation.longitude}
                onChange={(e) => setEditLocation({ ...editLocation, longitude: e.target.value })}
                disabled={submitting}
              />
            </div>
          </div>
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
            onClick={confirmEdit} 
            className="bg-cbs hover:bg-cbs-light"
            disabled={submitting}
          >
            {submitting ? (
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

export default SessionEditDialog;
