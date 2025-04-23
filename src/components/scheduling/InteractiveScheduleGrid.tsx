import React, { useState, useEffect, useRef } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Schedule, Session } from "@/types";
import { Info, AlertCircle } from "lucide-react";

interface InteractiveScheduleGridProps {
  currentDate: Date;
  interviewers: { id: string; code: string; first_name: string; last_name: string }[];
  schedules: Schedule[];
  sessions: Session[];
  onScheduleSlot: (interviewerId: string, startTime: Date, endTime: Date) => Promise<void>;
  onUnscheduleSlot: (scheduleId: string) => Promise<void>;
}

interface CellState {
  isScheduled: boolean;
  scheduleId?: string;
  isSession: boolean;
  sessionId?: string;
  startTime: Date;
  endTime: Date;
  status?: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00

export const InteractiveScheduleGrid: React.FC<InteractiveScheduleGridProps> = ({
  currentDate,
  interviewers,
  schedules,
  sessions,
  onScheduleSlot,
  onUnscheduleSlot,
}) => {
  const [grid, setGrid] = useState<Record<string, Record<number, CellState>>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{ interviewerId: string; hour: number } | null>(null);
  const [dragEndCell, setDragEndCell] = useState<{ interviewerId: string; hour: number } | null>(null);
  const [loading, setLoading] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);

  // Initialize the grid data
  useEffect(() => {
    const newGrid: Record<string, Record<number, CellState>> = {};
    
    // Initialize empty grid
    interviewers.forEach(interviewer => {
      newGrid[interviewer.id] = {};
      hours.forEach(hour => {
        const startTime = new Date(currentDate);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(currentDate);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        newGrid[interviewer.id][hour] = {
          isScheduled: false,
          isSession: false,
          startTime,
          endTime,
        };
      });
    });
    
    // Add schedules
    schedules.forEach(schedule => {
      const scheduleDate = parseISO(schedule.start_time);
      const scheduleHour = scheduleDate.getHours();
      
      if (isSameDay(scheduleDate, currentDate) && 
          hours.includes(scheduleHour) && 
          newGrid[schedule.interviewer_id]) {
        
        newGrid[schedule.interviewer_id][scheduleHour] = {
          ...newGrid[schedule.interviewer_id][scheduleHour],
          isScheduled: true,
          scheduleId: schedule.id,
          status: schedule.status,
          notes: schedule.notes,
        };
      }
    });
    
    // Add sessions
    sessions.forEach(session => {
      if (!session.start_time || !session.end_time) return;
      
      const sessionStart = parseISO(session.start_time);
      const sessionStartHour = sessionStart.getHours();
      
      if (isSameDay(sessionStart, currentDate) && 
          hours.includes(sessionStartHour) && 
          newGrid[session.interviewer_id]) {
        
        newGrid[session.interviewer_id][sessionStartHour] = {
          ...newGrid[session.interviewer_id][sessionStartHour],
          isSession: true,
          sessionId: session.id,
        };
      }
    });
    
    setGrid(newGrid);
  }, [currentDate, interviewers, schedules, sessions]);

  // Handle mouse events for drag selection
  const handleMouseDown = (interviewerId: string, hour: number) => {
    setIsDragging(true);
    setDragStartCell({ interviewerId, hour });
    setDragEndCell({ interviewerId, hour });
  };

  const handleMouseOver = (interviewerId: string, hour: number) => {
    if (isDragging) {
      setDragEndCell({ interviewerId, hour });
    }
  };

  const handleMouseUp = async () => {
    if (isDragging && dragStartCell && dragEndCell) {
      setLoading(true);
      
      try {
        // Determine the rectangle of selected cells
        const startInterviewerIndex = interviewers.findIndex(i => i.id === dragStartCell.interviewerId);
        const endInterviewerIndex = interviewers.findIndex(i => i.id === dragEndCell.interviewerId);
        
        const minInterviewerIndex = Math.min(startInterviewerIndex, endInterviewerIndex);
        const maxInterviewerIndex = Math.max(startInterviewerIndex, endInterviewerIndex);
        
        const minHour = Math.min(dragStartCell.hour, dragEndCell.hour);
        const maxHour = Math.max(dragStartCell.hour, dragEndCell.hour);
        
        // Get all cells in the selection
        const selectedCells: { interviewerId: string; hour: number; cell: CellState }[] = [];
        
        for (let i = minInterviewerIndex; i <= maxInterviewerIndex; i++) {
          const interviewerId = interviewers[i].id;
          
          for (let hour = minHour; hour <= maxHour; hour++) {
            if (grid[interviewerId] && grid[interviewerId][hour]) {
              selectedCells.push({
                interviewerId,
                hour,
                cell: grid[interviewerId][hour],
              });
            }
          }
        }
        
        // Check if we need to schedule or unschedule
        // If most cells are already scheduled, we'll unschedule all
        // Otherwise, we'll schedule all unscheduled cells
        const scheduledCount = selectedCells.filter(({ cell }) => cell.isScheduled).length;
        const shouldUnschedule = scheduledCount > selectedCells.length / 2;
        
        const operations = [];
        
        if (shouldUnschedule) {
          // Unschedule all scheduled cells
          for (const { cell } of selectedCells) {
            if (cell.isScheduled && cell.scheduleId) {
              operations.push(onUnscheduleSlot(cell.scheduleId));
            }
          }
        } else {
          // Schedule all unscheduled cells
          for (const { interviewerId, cell } of selectedCells) {
            if (!cell.isScheduled) {
              operations.push(onScheduleSlot(interviewerId, cell.startTime, cell.endTime));
            }
          }
        }
        
        await Promise.all(operations);
      } catch (error) {
        console.error("Error processing batch schedule operation:", error);
      } finally {
        setLoading(false);
        setIsDragging(false);
        setDragStartCell(null);
        setDragEndCell(null);
      }
    }
  };

  const handleCellClick = async (interviewerId: string, hour: number) => {
    if (loading) return;
    
    const cell = grid[interviewerId][hour];
    setLoading(true);
    
    try {
      if (cell.isScheduled && cell.scheduleId) {
        await onUnscheduleSlot(cell.scheduleId);
      } else {
        await onScheduleSlot(interviewerId, cell.startTime, cell.endTime);
      }
    } catch (error) {
      console.error("Error toggling schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if a cell is in the current drag selection
  const isCellInDragSelection = (interviewerId: string, hour: number) => {
    if (!isDragging || !dragStartCell || !dragEndCell) return false;
    
    const startInterviewerIndex = interviewers.findIndex(i => i.id === dragStartCell.interviewerId);
    const endInterviewerIndex = interviewers.findIndex(i => i.id === dragEndCell.interviewerId);
    const currentInterviewerIndex = interviewers.findIndex(i => i.id === interviewerId);
    
    const minInterviewerIndex = Math.min(startInterviewerIndex, endInterviewerIndex);
    const maxInterviewerIndex = Math.max(startInterviewerIndex, endInterviewerIndex);
    
    const minHour = Math.min(dragStartCell.hour, dragEndCell.hour);
    const maxHour = Math.max(dragStartCell.hour, dragEndCell.hour);
    
    return (
      currentInterviewerIndex >= minInterviewerIndex &&
      currentInterviewerIndex <= maxInterviewerIndex &&
      hour >= minHour &&
      hour <= maxHour
    );
  };

  return (
    <div 
      className={`relative overflow-x-auto ${loading ? 'opacity-70 pointer-events-none' : ''}`}
      onMouseLeave={() => setIsDragging(false)}
      onMouseUp={handleMouseUp}
      ref={gridRef}
    >
      <div className="min-w-[768px]">
        {/* Header row with hours */}
        <div className="grid grid-cols-[150px_repeat(11,1fr)] border-b">
          <div className="p-2 text-center font-medium border-r">Interviewer</div>
          {hours.map(hour => (
            <div key={hour} className="p-2 text-center font-medium">
              {hour}:00
            </div>
          ))}
        </div>
        
        {/* Grid rows */}
        {interviewers.map(interviewer => (
          <div key={interviewer.id} className="grid grid-cols-[150px_repeat(11,1fr)] border-b">
            <div className="p-2 border-r text-sm font-medium truncate">
              {interviewer.code}: {interviewer.first_name} {interviewer.last_name}
            </div>
            
            {hours.map(hour => {
              const cell = grid[interviewer.id]?.[hour];
              
              if (!cell) return <div key={hour} className="p-2 h-12 border-r"></div>;
              
              const inDragSelection = isCellInDragSelection(interviewer.id, hour);
              
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
              
              return (
                <TooltipProvider key={hour}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={cellClass}
                        onMouseDown={() => handleMouseDown(interviewer.id, hour)}
                        onMouseOver={() => handleMouseOver(interviewer.id, hour)}
                        onClick={() => handleCellClick(interviewer.id, hour)}
                      >
                        <div className="text-xs">
                          {format(cell.startTime, "HH:mm")} - {format(cell.endTime, "HH:mm")}
                        </div>
                        {(cell.isScheduled || cell.isSession) && (
                          <div className="absolute top-0.5 right-0.5 flex space-x-0.5">
                            {cell.isScheduled && <Info size={12} className="text-cbs" />}
                            {cell.isSession && <AlertCircle size={12} className="text-green-500" />}
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
                        {cell.isSession && <p>Session activity detected</p>}
                        {!cell.isScheduled && !cell.isSession && <p>Available slot</p>}
                        <p className="text-xs text-muted-foreground">
                          {cell.isScheduled ? "Click to unschedule" : "Click to schedule"}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
