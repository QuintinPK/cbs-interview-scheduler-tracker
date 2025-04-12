
import React from "react";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarWithTime } from "@/components/ui/calendar-with-time";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Interviewer, Schedule, Project } from "@/types";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  selectedSchedule: Schedule | null;
  selectedInterviewer: Interviewer | undefined;
  selectedInterviewerCode: string;
  interviewers: Interviewer[];
  dateRange: DateRange | undefined;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  startTime: string;
  setStartTime: React.Dispatch<React.SetStateAction<string>>;
  endTime: string;
  setEndTime: React.Dispatch<React.SetStateAction<string>>;
  status: "scheduled" | "completed" | "cancelled";
  setStatus: React.Dispatch<React.SetStateAction<"scheduled" | "completed" | "cancelled">>;
  projects: Project[];
  selectedProjectId: string | null;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  onSubmit: () => Promise<void>;
}

export const ScheduleDialog = ({
  open,
  onOpenChange,
  isEditing,
  selectedSchedule,
  selectedInterviewer,
  selectedInterviewerCode,
  interviewers,
  dateRange,
  setDateRange,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  status,
  setStatus,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  onSubmit,
}: ScheduleDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Schedule" : "Add New Schedule"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Interviewer</Label>
            <Select
              value={selectedInterviewerCode}
              disabled
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interviewers.map((interviewer) => (
                  <SelectItem key={interviewer.id} value={interviewer.code}>
                    {interviewer.code} - {interviewer.first_name} {interviewer.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Project</Label>
            <Select
              value={selectedProjectId || "_none"}
              onValueChange={(value) => setSelectedProjectId(value === "_none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.island})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <CalendarWithTime
            selectedRange={dateRange}
            onRangeChange={setDateRange}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
          />
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: "scheduled" | "completed" | "cancelled") => setStatus(value)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} className="bg-cbs hover:bg-cbs-light">
            {isEditing ? "Save Changes" : "Add Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
