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
  sessionSpanData?: {
    isStart: boolean;
    isEnd: boolean;
    actualStartTime: Date;
    actualEndTime: Date;
  };
}

interface InteractiveGridCellProps {
  cell: CellState;
  inDragSelection: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseOver: (e: React.MouseEvent) => void;
  onClick: () => void;
  isProcessing?: boolean;
  isTransitioning?: boolean;
  showRealised?: boolean;
}

export const InteractiveGridCell: React.FC<InteractiveGridCellProps> = ({
  cell,
  inDragSelection,
  onMouseDown,
  onMouseOver,
  onClick,
  isProcessing = false,
  isTransitioning = false,
  showRealised = true
}) => {
  const [showSessionDialog, setShowSessionDialog] = React.useState(false);
  const navigate = useNavigate();

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
  } else if (cell.isSession && showRealised) {
    cellClass += " bg-green-50";
    if (cell.sessionSpanData?.isStart) {
      cellClass += " border-t border-l border-green-200";
    }
    if (cell.sessionSpanData?.isEnd) {
      cellClass += " border-b border-r border-green-200";
    }
    if (!cell.sessionSpanData?.isStart && !cell.sessionSpanData?.isEnd) {
      cellClass += " border-l border-r border-green-200";
    }
  } else {
    cellClass += " hover:bg-gray-100";
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

  const handleGoToSession = () => {
    if (cell.session?.id) {
      navigate(`/admin/sessions?session=${cell.session.id}`);
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
            {cell.isSession && showRealised && cell.session && cell.sessionSpanData?.isStart && (
              <div className="text-xs text-gray-600">
                {format(cell.sessionSpanData.actualStartTime, "HH:mm")} - {format(cell.sessionSpanData.actualEndTime, "HH:mm")}
              </div>
            )}
            {(cell.isScheduled || (cell.isSession && showRealised)) && (
              <div className="absolute top-0.5 right-0.5 flex space-x-0.5">
                {cell.isScheduled && <Info size={12} className="text-cbs" />}
                {cell.isSession && showRealised && cell.sessionSpanData?.isStart && (
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

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Time</h3>
              <p>Started: {format(cell.session?.start_time ? new Date(cell.session.start_time) : cell.startTime, "PPpp")}</p>
              <p>Ended: {cell.session?.end_time ? format(new Date(cell.session.end_time), "PPpp") : "Session ongoing"}</p>
            </div>
            {cell.session?.project_id && (
              <div>
                <h3 className="font-medium">Project</h3>
                <p>{cell.session.project_id}</p>
              </div>
            )}
            <Button onClick={handleGoToSession} className="w-full">
              View in Session Logs
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
