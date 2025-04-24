
import React, { useState } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { Info, AlertCircle, Edit } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Session } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useSessionActions } from '@/hooks/useSessionActions';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CellState {
  isScheduled: boolean;
  scheduleId?: string;
  isSession: boolean;
  sessionId?: string;
  startTime: Date;
  endTime: Date;
  status?: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  session?: Session;
}

interface InteractiveGridCellProps {
  cell: CellState;
  inDragSelection: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseOver: (e: React.MouseEvent) => void;
  onClick: () => void;
  isProcessing?: boolean;
  isTransitioning?: boolean;
  onSessionUpdated?: () => void;
}

export const InteractiveGridCell: React.FC<InteractiveGridCellProps> = ({
  cell,
  inDragSelection,
  onMouseDown,
  onMouseOver,
  onClick,
  isProcessing = false,
  isTransitioning = false,
  onSessionUpdated
}) => {
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showEditPopover, setShowEditPopover] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [notes, setNotes] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { projects } = useProjects();
  const { updateSession, deleteSession } = useSessionActions(
    [], // We don't need the full sessions list here
    () => {}, // Placeholder for setSessions
    [], // Placeholder for filteredSessions
    () => {}, // Placeholder for setLoading
    toast
  );

  let cellClass = "p-1 h-12 border-r cursor-pointer transition-all relative";
  
  if (isTransitioning) {
    if (inDragSelection) {
      cellClass += " bg-green-300/70 border border-green-400";
    } else {
      cellClass += " bg-gray-100 border border-gray-200";
    }
  } else if (cell.isScheduled) {
    if (cell.status === 'completed') {
      cellClass += " bg-green-100 border border-green-300";
    } else if (cell.status === 'cancelled') {
      cellClass += " bg-gray-100 border border-gray-300 opacity-60";
    } else {
      cellClass += " bg-cbs-light/20 border border-cbs-light/40";
    }
  } else if (cell.isSession) {
    cellClass += " bg-green-50 border border-green-200";
  } else {
    cellClass += " bg-gray-50 hover:bg-gray-100";
  }
  
  if (inDragSelection) {
    cellClass += " ring-2 ring-cbs-light ring-opacity-70 bg-cbs-light/10";
  }
  
  if (isProcessing) {
    cellClass += " opacity-40";
  }

  const handleViewSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSessionDialog(true);
  };

  const handleEditSession = () => {
    if (!cell.session) return;
    
    setNotes(cell.session.notes || "");
    setShowEditPopover(true);
  };

  const handleSaveNotes = async () => {
    if (!cell.session) return;
    
    try {
      await updateSession(cell.session.id, { notes });
      toast({
        title: "Success",
        description: "Session notes updated",
      });
      setShowEditPopover(false);
      
      if (onSessionUpdated) {
        onSessionUpdated();
      }
    } catch (error) {
      console.error("Error updating session notes:", error);
      toast({
        title: "Error",
        description: "Failed to update session notes",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!cell.session) return;
    
    try {
      await deleteSession(cell.session.id);
      toast({
        title: "Success",
        description: "Session deleted",
      });
      setShowDeleteAlert(false);
      setShowSessionDialog(false);
      
      if (onSessionUpdated) {
        onSessionUpdated();
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  // Get project name from ID
  const getProjectName = (projectId?: string) => {
    if (!projectId) return "No project assigned";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown project";
  };

  // Calculate session duration
  const getSessionDuration = () => {
    if (!cell.session) return "N/A";
    
    const startTime = new Date(cell.session.start_time);
    
    if (!cell.session.end_time) {
      return "Session ongoing";
    }
    
    const endTime = new Date(cell.session.end_time);
    const minutes = differenceInMinutes(endTime, startTime);
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cellClass}
            onMouseDown={onMouseDown}
            onMouseOver={onMouseOver}
            onClick={onClick}
          >
            <div className="text-xs">
              {format(cell.startTime, "HH:mm")} - {format(cell.endTime, "HH:mm")}
            </div>
            {(cell.isScheduled || cell.isSession) && (
              <div className="absolute top-0.5 right-0.5 flex space-x-0.5">
                {cell.isScheduled && <Info size={12} className="text-cbs" />}
                {cell.isSession && (
                  <button 
                    onClick={handleViewSession}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <AlertCircle size={12} className="text-green-500" />
                  </button>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 p-1">
            <p className="font-semibold">
              {format(cell.startTime, "HH:mm")} - {format(cell.endTime, "HH:mm")}
            </p>
            {cell.isScheduled && (
              <>
                <p>Status: {cell.status}</p>
                {cell.notes && <p>Notes: {cell.notes}</p>}
              </>
            )}
            {cell.isSession && (
              <>
                <p>Session activity registered</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs"
                  onClick={handleViewSession}
                >
                  View session details
                </Button>
              </>
            )}
            {!cell.isScheduled && !cell.isSession && <p>Available slot</p>}
            <p className="text-xs text-muted-foreground">
              {cell.isScheduled ? "Click to unschedule" : "Click to schedule"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Session Details Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Time</h3>
              <p>Started: {format(cell.session?.start_time ? new Date(cell.session.start_time) : cell.startTime, "PPpp")}</p>
              <p>Ended: {cell.session?.end_time ? format(new Date(cell.session.end_time), "PPpp") : "Session ongoing"}</p>
              <p>Duration: {getSessionDuration()}</p>
            </div>
            {cell.session?.project_id && (
              <div>
                <h3 className="font-medium">Project</h3>
                <p>{getProjectName(cell.session.project_id)}</p>
              </div>
            )}
            {cell.session?.notes && (
              <div>
                <h3 className="font-medium">Notes</h3>
                <p>{cell.session.notes}</p>
              </div>
            )}
            {cell.session?.start_address && (
              <div>
                <h3 className="font-medium">Location</h3>
                <p>Start: {cell.session.start_address}</p>
                {cell.session.end_address && <p>End: {cell.session.end_address}</p>}
              </div>
            )}
            <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-between sm:space-x-2">
              <div className="flex gap-2">
                <Popover open={showEditPopover} onOpenChange={setShowEditPopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Notes
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Edit Session Notes</h4>
                        <Label htmlFor="notes">Notes</Label>
                        <Input 
                          id="notes" 
                          value={notes} 
                          onChange={(e) => setNotes(e.target.value)} 
                          autoComplete="off"
                        />
                      </div>
                      <Button onClick={handleSaveNotes}>Save</Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteAlert(true)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
              <Button onClick={() => setShowSessionDialog(false)} className="flex-1">
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};
