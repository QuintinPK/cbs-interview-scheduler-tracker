
import React from 'react';
import { format, differenceInMinutes, getMinutes, startOfHour, endOfHour, isSameHour } from 'date-fns';
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
    startMinuteOffset?: number;
    endMinuteOffset?: number;
    isFullHour: boolean;
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

  const getSessionStyle = () => {
    if (!cell.sessionSpanData || !showRealised) return {};

    const { startMinuteOffset = 0, endMinuteOffset = 60, isFullHour } = cell.sessionSpanData;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: '4px',
      right: '4px',
      backgroundColor: 'rgb(240 253 244)',
      borderLeft: '1px solid rgb(134 239 172)',
      borderRight: '1px solid rgb(134 239 172)',
      zIndex: 10,
    };

    // Calculate top and height based on minute offsets
    if (isFullHour) {
      style.top = '0%';
      style.height = '100%';
    } else {
      const startPercent = (startMinuteOffset / 60) * 100;
      const endPercent = (endMinuteOffset / 60) * 100;
      style.top = `${startPercent}%`;
      style.height = `${endPercent - startPercent}%`;
    }

    // Add borders based on position in the session span
    if (cell.sessionSpanData.isStart) {
      style.borderTop = '1px solid rgb(134 239 172)';
    }
    if (cell.sessionSpanData.isEnd) {
      style.borderBottom = '1px solid rgb(134 239 172)';
    }

    return style;
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
              <div 
                style={getSessionStyle()}
                className="flex flex-col justify-between"
              >
                <div className="text-xs text-gray-600 p-1">
                  {format(cell.sessionSpanData.actualStartTime, "HH:mm")} - {format(cell.sessionSpanData.actualEndTime, "HH:mm")}
                </div>
                <div className="absolute top-0.5 right-0.5">
                  <button 
                    onClick={handleViewSession}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <AlertCircle size={12} className="text-green-500" />
                  </button>
                </div>
              </div>
            )}
            {cell.isScheduled && (
              <div className="absolute top-0.5 right-0.5">
                <Info size={12} className="text-cbs" />
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
