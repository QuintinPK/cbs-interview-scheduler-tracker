
import React from 'react';
import { format } from 'date-fns';
import { Info, AlertCircle } from 'lucide-react';
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

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
}

export const InteractiveGridCell: React.FC<InteractiveGridCellProps> = ({
  cell,
  inDragSelection,
  onMouseDown,
  onMouseOver,
  onClick,
}) => {
  const [showSessionDialog, setShowSessionDialog] = React.useState(false);
  const navigate = useNavigate();

  let cellClass = "p-1 h-12 border-r cursor-pointer transition-colors relative";
  
  if (cell.isScheduled) {
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
    cellClass += " ring-2 ring-cbs-light ring-opacity-70";
  }

  const handleViewSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSessionDialog(true);
  };

  const handleGoToSession = () => {
    if (cell.session?.id) {
      navigate(`/admin/sessions/${cell.session.id}`);
    }
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
                  <button onClick={handleViewSession}>
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
                <p>Session activity detected</p>
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

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Time</h3>
              <p>{format(cell.startTime, "PPpp")} - {format(cell.endTime, "PPpp")}</p>
            </div>
            {cell.session && (
              <>
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p>Start: {cell.session.start_address || 'Not recorded'}</p>
                  <p>End: {cell.session.end_address || 'Not recorded'}</p>
                </div>
                <div>
                  <h3 className="font-medium">Status</h3>
                  <p>{cell.session.is_active ? 'Active' : 'Completed'}</p>
                </div>
                <Button onClick={handleGoToSession} className="w-full">
                  Go to Session Details
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
