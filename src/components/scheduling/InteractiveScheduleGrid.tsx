
import React, { useState, useEffect, useRef } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Schedule, Session } from "@/types";
import { Info, AlertCircle } from "lucide-react";
import { InteractiveGridCell } from './InteractiveGridCell';

interface InteractiveScheduleGridProps {
  currentDate: Date;
  weekDates?: Date[];
  interviewers: { id: string; code: string; first_name: string; last_name: string }[];
  schedules: Schedule[];
  sessions: Session[];
  onScheduleSlot: (interviewerId: string, startTime: Date, endTime: Date) => Promise<void>;
  onUnscheduleSlot: (scheduleId: string) => Promise<void>;
  viewMode?: "day" | "week";
  hours?: number[];
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
  session?: Session;
}

const defaultHours = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

export const InteractiveScheduleGrid: React.FC<InteractiveScheduleGridProps> = ({
  currentDate,
  weekDates,
  interviewers,
  schedules,
  sessions,
  onScheduleSlot,
  onUnscheduleSlot,
  viewMode = "day",
  hours = defaultHours,
}) => {
  const [grid, setGrid] = useState<any>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<any>(null);
  const [dragEndCell, setDragEndCell] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    } else if (weekDates && interviewers.length === 1) {
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
  }, [currentDate, weekDates, interviewers, schedules, sessions, viewMode, hours]);

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
        const startInterviewerIndex = interviewers.findIndex(i => i.id === dragStartCell.interviewerId);
        const endInterviewerIndex = interviewers.findIndex(i => i.id === dragEndCell.interviewerId);

        const minInterviewerIndex = Math.min(startInterviewerIndex, endInterviewerIndex);
        const maxInterviewerIndex = Math.max(startInterviewerIndex, endInterviewerIndex);

        const minHour = Math.min(dragStartCell.hour, dragEndCell.hour);
        const maxHour = Math.max(dragStartCell.hour, dragEndCell.hour);

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

        const scheduleOps = [];
        let anyDeleted = false;
        for (const { cell } of selectedCells) {
          if (cell.isScheduled && cell.scheduleId) {
            scheduleOps.push(onUnscheduleSlot(cell.scheduleId));
            anyDeleted = true;
          }
        }
        await Promise.all(scheduleOps);

        if (!anyDeleted) {
          const addOps = [];
          for (const { interviewerId, cell } of selectedCells) {
            if (!cell.isScheduled) {
              addOps.push(onScheduleSlot(interviewerId, cell.startTime, cell.endTime));
            }
          }
          await Promise.all(addOps);
        }
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
        const minDay = Math.min(dragStartCell.dayIdx, dragEndCell.dayIdx);
        const maxDay = Math.max(dragStartCell.dayIdx, dragEndCell.dayIdx);
        const minHour = Math.min(dragStartCell.hour, dragEndCell.hour);
        const maxHour = Math.max(dragStartCell.hour, dragEndCell.hour);
        const selectedCells: { dayIdx: number; hour: number; cell: CellState }[] = [];
        for (let d = minDay; d <= maxDay; d++) {
          for (let h = minHour; h <= maxHour; h++) {
            if (grid[d] && grid[d][h]) {
              selectedCells.push({ dayIdx: d, hour: h, cell: grid[d][h] });
            }
          }
        }
        const scheduleOps = [];
        let anyDeleted = false;
        for (const { cell } of selectedCells) {
          if (cell.isScheduled && cell.scheduleId)
            scheduleOps.push(onUnscheduleSlot(cell.scheduleId));
            anyDeleted = true;
        }
        await Promise.all(scheduleOps);

        if (!anyDeleted) {
          const addOps = [];
          for (const { cell } of selectedCells) {
            if (!cell.isScheduled)
              addOps.push(onScheduleSlot(interviewers[0].id, cell.startTime, cell.endTime));
          }
          await Promise.all(addOps);
        }
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

  const renderCell = (cell: CellState, dayIdx: number, hour: number) => {
    if (!cell) return <div className="p-2 h-12 border-r"></div>;
    
    const inDragSelection = viewMode === 'week' 
      ? isCellInDragSelectionWeek(dayIdx, hour)
      : isCellInDragSelection(interviewers[0].id, hour);

    return (
      <InteractiveGridCell
        cell={cell}
        inDragSelection={inDragSelection}
        onMouseDown={() => viewMode === 'week' 
          ? handleMouseDownWeek(dayIdx, hour)
          : handleMouseDown(interviewers[0].id, hour)
        }
        onMouseOver={() => viewMode === 'week'
          ? handleMouseOverWeek(dayIdx, hour)
          : handleMouseOver(interviewers[0].id, hour)
        }
        onClick={() => viewMode === 'week'
          ? handleCellClickWeek(dayIdx, hour)
          : handleCellClick(interviewers[0].id, hour)
        }
      />
    );
  };

  const gridStyle = isDragging ? "user-select-none" : "";

  if (viewMode === "week" && weekDates && interviewers.length === 1 && Object.keys(grid).length > 0) {
    return (
      <div
        className={`relative overflow-x-auto ${loading ? "opacity-70 pointer-events-none" : ""} ${gridStyle}`}
        onMouseLeave={() => setIsDragging(false)}
        onMouseUp={handleMouseUpWeek}
        ref={gridRef}
      >
        <div className="min-w-full">
          <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
            <div className="p-2 text-center font-medium border-r">Time</div>
            {weekDates.map((dateObj, dIdx) => (
              <div key={dIdx} className="p-2 text-center font-medium whitespace-nowrap">
                {format(dateObj, "E, MMM d")}
              </div>
            ))}
          </div>
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
              <div className="p-2 border-r text-sm font-medium text-center">{hour}:00</div>
              {weekDates.map((dateObj, dIdx) => {
                const cell = grid[dIdx]?.[hour];
                return cell ? renderCell(cell, dIdx, hour) : null;
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-x-auto ${loading ? 'opacity-70 pointer-events-none' : ''} ${gridStyle}`}
      onMouseLeave={() => setIsDragging(false)}
      onMouseUp={handleMouseUp}
      ref={gridRef}
    >
      <div className="min-w-[768px]">
        <div className={`grid grid-cols-[150px_repeat(${hours.length},1fr)] border-b`}>
          <div className="p-2 text-center font-medium border-r">Interviewer</div>
          {hours.map(hour => (
            <div key={hour} className="p-2 text-center font-medium">
              {hour}:00
            </div>
          ))}
        </div>
        
        {interviewers.map(interviewer => (
          <div key={interviewer.id} className={`grid grid-cols-[150px_repeat(${hours.length},1fr)] border-b`}>
            <div className="p-2 border-r text-sm font-medium truncate">
              {interviewer.code}: {interviewer.first_name} {interviewer.last_name}
            </div>
            
            {hours.map(hour => {
              const cell = grid[interviewer.id]?.[hour];
              return cell ? renderCell(cell, 0, hour) : null;
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
