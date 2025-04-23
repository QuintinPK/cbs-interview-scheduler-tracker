import React, { useState, useEffect, useRef } from "react";
import { format, parseISO, isSameDay, isSameHour, isSameMinute } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Schedule, Session } from "@/types";
import { Info, AlertCircle } from "lucide-react";

interface InteractiveScheduleGridProps {
  currentDate: Date;
  weekDates?: Date[];
  interviewers: { id: string; code: string; first_name: string; last_name: string }[];
  schedules: Schedule[];
  sessions: Session[];
  onScheduleSlot: (interviewerId: string, startTime: Date, endTime: Date) => Promise<void>;
  onUnscheduleSlot: (scheduleId: string) => Promise<void>;
  viewMode?: "day" | "week";
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
  weekDates,
  interviewers,
  schedules,
  sessions,
  onScheduleSlot,
  onUnscheduleSlot,
  viewMode = "day"
}) => {
  const [grid, setGrid] = useState<any>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<any>(null);
  const [dragEndCell, setDragEndCell] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  // Initialize the grid data
  useEffect(() => {
    // DAY VIEW: same as before
    if (viewMode === "day" || !weekDates) {
      const newGrid: Record<string, Record<number, CellState>> = {};
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
    }
    // WEEK VIEW: (single interviewer, multiple days)
    else if (weekDates && interviewers.length === 1) {
      const interviewerId = interviewers[0].id;
      const newGrid: Record<number, Record<number, CellState>> = {};
      weekDates.forEach((dateObj, dIdx) => {
        newGrid[dIdx] = {};
        hours.forEach(hour => {
          const startTime = new Date(dateObj);
          startTime.setHours(hour, 0, 0, 0);
          const endTime = new Date(dateObj);
          endTime.setHours(hour + 1, 0, 0, 0);
          newGrid[dIdx][hour] = {
            isScheduled: false,
            isSession: false,
            startTime,
            endTime
          };
        });
      });

      // Add schedules
      schedules.forEach(schedule => {
        const scheduleDate = parseISO(schedule.start_time);
        const scheduleHour = scheduleDate.getHours();
        weekDates.forEach((dateObj, dIdx) => {
          if (isSameDay(scheduleDate, dateObj) && hours.includes(scheduleHour)) {
            newGrid[dIdx][scheduleHour] = {
              ...newGrid[dIdx][scheduleHour],
              isScheduled: true,
              scheduleId: schedule.id,
              status: schedule.status,
              notes: schedule.notes,
            };
          }
        });
      });
      // Add sessions
      sessions.forEach(session => {
        if (!session.start_time || !session.end_time) return;
        const sessionStart = parseISO(session.start_time);
        const sessionStartHour = sessionStart.getHours();
        weekDates.forEach((dateObj, dIdx) => {
          if (isSameDay(sessionStart, dateObj) && hours.includes(sessionStartHour)) {
            newGrid[dIdx][sessionStartHour] = {
              ...newGrid[dIdx][sessionStartHour],
              isSession: true,
              sessionId: session.id,
            };
          }
        });
      });

      setGrid(newGrid);
    }
  }, [currentDate, weekDates, interviewers, schedules, sessions, viewMode]);

  // Mouse event handlers for drag to schedule (for both day/week)
  // (Logic for handling drag selection stays the same except for grid structure)

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

  // Helper for week mode 
  const isCellInDragSelectionWeek = (dayIdx: number, hour: number) => {
    if (!isDragging || !dragStartCell || !dragEndCell) return false;
    const { dayIdx: startDayIdx, hour: startHour } = dragStartCell;
    const { dayIdx: endDayIdx, hour: endHour } = dragEndCell;
    const minDay = Math.min(startDayIdx, endDayIdx);
    const maxDay = Math.max(startDayIdx, endDayIdx);
    const minHour = Math.min(startHour, endHour);
    const maxHour = Math.max(startHour, endHour);
    return (
      dayIdx >= minDay &&
      dayIdx <= maxDay &&
      hour >= minHour &&
      hour <= maxHour
    );
  };

  // Mouse handlers for week view
  const handleMouseDownWeek = (dayIdx: number, hour: number) => {
    setIsDragging(true);
    setDragStartCell({ dayIdx, hour });
    setDragEndCell({ dayIdx, hour });
  };
  const handleMouseOverWeek = (dayIdx: number, hour: number) => {
    if (isDragging) setDragEndCell({ dayIdx, hour });
  };
  const handleMouseUpWeek = async () => {
    if (isDragging && dragStartCell && dragEndCell) {
      setLoading(true);
      try {
        // Rectangle select
        const minDay = Math.min(dragStartCell.dayIdx, dragEndCell.dayIdx);
        const maxDay = Math.max(dragStartCell.dayIdx, dragEndCell.dayIdx);
        const minHour = Math.min(dragStartCell.hour, dragEndCell.hour);
        const maxHour = Math.max(dragStartCell.hour, endHour);
        const selectedCells: { dayIdx: number; hour: number; cell: CellState }[] = [];
        for (let d = minDay; d <= maxDay; d++) {
          for (let h = minHour; h <= maxHour; h++) {
            if (grid[d] && grid[d][h]) {
              selectedCells.push({ dayIdx: d, hour: h, cell: grid[d][h] });
            }
          }
        }
        // Most are scheduled? unschedule, otherwise schedule all unscheduled
        const scheduledCount = selectedCells.filter(({ cell }) => cell.isScheduled).length;
        const shouldUnschedule = scheduledCount > selectedCells.length / 2;
        const operations = [];
        const interviewerId = interviewers[0].id;
        if (shouldUnschedule) {
          for (const { cell } of selectedCells) {
            if (cell.isScheduled && cell.scheduleId)
              operations.push(onUnscheduleSlot(cell.scheduleId));
          }
        } else {
          for (const { cell } of selectedCells) {
            if (!cell.isScheduled)
              operations.push(onScheduleSlot(interviewerId, cell.startTime, cell.endTime));
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

  // Click cell in week view
  const handleCellClickWeek = async (dayIdx: number, hour: number) => {
    if (loading) return;
    const cell = grid[dayIdx][hour];
    setLoading(true);
    try {
      if (cell.isScheduled && cell.scheduleId) {
        await onUnscheduleSlot(cell.scheduleId);
      } else {
        await onScheduleSlot(interviewers[0].id, cell.startTime, cell.endTime);
      }
    } catch (error) {
      console.error("Error toggling schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Main render ---
  if (viewMode === "week" && weekDates && interviewers.length === 1 && Object.keys(grid).length > 0) {
    return (
      <div
        className={`relative overflow-x-auto ${loading ? "opacity-70 pointer-events-none" : ""}`}
        onMouseLeave={() => setIsDragging(false)}
        onMouseUp={handleMouseUpWeek}
        ref={gridRef}
      >
        <div className="min-w-full">
          {/* Header row with days */}
          <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
            <div className="p-2 text-center font-medium border-r">Time</div>
            {weekDates.map((dateObj, dIdx) => (
              <div key={dIdx} className="p-2 text-center font-medium whitespace-nowrap">
                {format(dateObj, "E, MMM d")}
              </div>
            ))}
          </div>
          {/* Grid rows (hour blocks) */}
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
              <div className="p-2 border-r text-sm font-medium text-center">{hour}:00</div>
              {weekDates.map((dateObj, dIdx) => {
                const cell = grid[dIdx]?.[hour];
                if (!cell) return <div key={dIdx} className="p-2 h-12 border-r"></div>;
                const inDragSelection = isCellInDragSelectionWeek(dIdx, hour);
                let cellClass = "p-1 h-12 border-r cursor-pointer transition-colors relative";
                if (cell.isScheduled) {
                  if (cell.status === "completed") {
                    cellClass += " bg-green-100 border border-green-300";
                  } else if (cell.status === "cancelled") {
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
                  <TooltipProvider key={dIdx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cellClass}
                          onMouseDown={() => handleMouseDownWeek(dIdx, hour)}
                          onMouseOver={() => handleMouseOverWeek(dIdx, hour)}
                          onClick={() => handleCellClickWeek(dIdx, hour)}
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
  }
  // DAY VIEW as before
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
