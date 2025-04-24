
import React, { useState, useEffect, useRef } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { Schedule, Session } from "@/types";
import { InteractiveGridCell } from './InteractiveGridCell';
import { useToast } from "@/hooks/use-toast";

interface InteractiveScheduleGridProps {
  currentDate: Date;
  weekDates: Date[];
  interviewers: { id: string; code: string; first_name: string; last_name: string }[];
  schedules: Schedule[];
  sessions: Session[];
  onScheduleSlot: (interviewerId: string, startTime: Date, endTime: Date) => Promise<void>;
  onUnscheduleSlot: (scheduleId: string) => Promise<void>;
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
  hours = defaultHours,
}) => {
  const [grid, setGrid] = useState<Record<number, Record<number, CellState>>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{dayIdx: number, hour: number} | null>(null);
  const [dragEndCell, setDragEndCell] = useState<{dayIdx: number, hour: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingCells, setProcessingCells] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState<'schedule' | 'unschedule' | null>(null);
  const [currentlyProcessingBatch, setCurrentlyProcessingBatch] = useState(false);
  const { toast } = useToast();
  
  const gridRef = useRef<HTMLDivElement>(null);
  const dragCellsRef = useRef<Set<string>>(new Set());

  // Build grid from schedules and sessions
  useEffect(() => {
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

    // Populate with schedules
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
    
    // Populate with sessions
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
            session: session,
          };
        }
      });
    });

    setGrid(newGrid);
  }, [currentDate, weekDates, interviewers, schedules, sessions, hours]);

  // Reset processing state when schedules or sessions change (if not currently in a batch operation)
  useEffect(() => {
    if (!currentlyProcessingBatch) {
      setProcessingCells([]);
      setBatchMode(null);
    }
  }, [schedules, sessions, currentlyProcessingBatch]);

  const handleMouseDown = (dayIdx: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setIsDragging(true);
    setDragStartCell({ dayIdx, hour });
    setDragEndCell({ dayIdx, hour });
    
    // Reset drag cells tracking
    dragCellsRef.current.clear();
    dragCellsRef.current.add(`${dayIdx}-${hour}`);
    
    // Determine operation type based on first cell
    const cell = grid[dayIdx][hour];
    if (cell?.isScheduled) {
      setBatchMode('unschedule');
    } else {
      setBatchMode('schedule');
    }
  };

  const handleMouseOver = (dayIdx: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging) {
      setDragEndCell({ dayIdx, hour });
      
      // Track this cell as part of the selection
      dragCellsRef.current.add(`${dayIdx}-${hour}`);
    }
  };

  const handleMouseUp = async () => {
    if (!isDragging || !dragStartCell || !dragEndCell || interviewers.length === 0) return;
    
    setLoading(true);
    setCurrentlyProcessingBatch(true);
    
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
      
      if (batchMode === 'unschedule') {
        // Track cells with schedule IDs for UI feedback
        const processingIds = selectedCells
          .filter(({ cell }) => cell.isScheduled && cell.scheduleId)
          .map(({ cell }) => cell.scheduleId as string);
        
        setProcessingCells(processingIds);
        
        // Create a temporary grid for immediate visual feedback
        const tempGrid = JSON.parse(JSON.stringify(grid));
        
        // Apply visual updates immediately
        for (const { dayIdx, hour } of selectedCells) {
          if (tempGrid[dayIdx]?.[hour]?.isScheduled) {
            tempGrid[dayIdx][hour] = {
              ...tempGrid[dayIdx][hour],
              isScheduled: false,
              scheduleId: undefined,
              status: undefined,
              notes: undefined
            };
          }
        }
        
        // Update UI first
        setGrid(tempGrid);
        
        // Then handle actual API operations
        const deleteOps = selectedCells
          .filter(({ cell }) => cell.isScheduled && cell.scheduleId)
          .map(({ cell }) => onUnscheduleSlot(cell.scheduleId as string));
        
        await Promise.all(deleteOps);
      } 
      else {
        // Create a temporary grid for visual updates
        const tempGrid = JSON.parse(JSON.stringify(grid));
        
        // Apply visual updates immediately
        for (const { dayIdx, hour } of selectedCells) {
          if (!tempGrid[dayIdx][hour].isScheduled) {
            tempGrid[dayIdx][hour] = {
              ...tempGrid[dayIdx][hour],
              isScheduled: true,
              status: 'scheduled'
            };
          }
        }
        
        // Update UI first
        setGrid(tempGrid);
        
        // Then handle actual API operations
        const addOps = selectedCells
          .filter(({ cell }) => !cell.isScheduled) 
          .map(({ cell }) => onScheduleSlot(interviewers[0].id, cell.startTime, cell.endTime));
        
        await Promise.all(addOps);
      }
      
      toast({
        title: "Success",
        description: batchMode === 'schedule' ? 
          "Time slots scheduled successfully" : 
          "Time slots unscheduled successfully",
      });
    } catch (error) {
      console.error("Error processing batch schedule operation:", error);
      toast({
        title: "Error",
        description: "Failed to process scheduling operation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
      setProcessingCells([]);
      setBatchMode(null);
      setCurrentlyProcessingBatch(false);
      dragCellsRef.current.clear();
    }
  };

  const handleCellClick = async (dayIdx: number, hour: number) => {
    if (loading || isDragging || interviewers.length === 0) return;
    
    const cell = grid[dayIdx][hour];
    setLoading(true);
    
    try {
      if (cell.isScheduled && cell.scheduleId) {
        setProcessingCells([cell.scheduleId]);
        
        // Immediately update UI
        const tempGrid = { ...grid };
        if (tempGrid[dayIdx] && tempGrid[dayIdx][hour]) {
          tempGrid[dayIdx][hour] = {
            ...tempGrid[dayIdx][hour],
            isScheduled: false,
            scheduleId: undefined,
            status: undefined,
            notes: undefined
          };
        }
        setGrid(tempGrid);
        
        await onUnscheduleSlot(cell.scheduleId);
        
        toast({
          title: "Success",
          description: "Time slot unscheduled",
        });
      } else {
        // Immediately update UI
        const tempGrid = { ...grid };
        if (tempGrid[dayIdx] && tempGrid[dayIdx][hour]) {
          tempGrid[dayIdx][hour] = {
            ...tempGrid[dayIdx][hour],
            isScheduled: true,
            status: 'scheduled'
          };
        }
        setGrid(tempGrid);
        
        await onScheduleSlot(interviewers[0].id, cell.startTime, cell.endTime);
        
        toast({
          title: "Success", 
          description: "Time slot scheduled",
        });
      }
    } catch (error) {
      console.error("Error toggling schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProcessingCells([]);
    }
  };

  const isCellInDragSelection = (dayIdx: number, hour: number) => {
    if (!isDragging || !dragStartCell || !dragEndCell) return false;
    
    const minDay = Math.min(dragStartCell.dayIdx, dragEndCell.dayIdx);
    const maxDay = Math.max(dragStartCell.dayIdx, dragEndCell.dayIdx);
    const minHour = Math.min(dragStartCell.hour, dragEndCell.hour);
    const maxHour = Math.max(dragStartCell.hour, dragEndCell.hour);
    
    return (
      dayIdx >= minDay &&
      dayIdx <= maxDay &&
      hour >= minHour &&
      hour <= maxHour
    );
  };

  // Check if a cell is in processing state
  const isCellProcessing = (scheduleId?: string) => {
    if (!scheduleId) return false;
    return processingCells.includes(scheduleId);
  };

  // Mouse leave handler - cancel dragging if mouse leaves grid
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
    }
  };

  // Global mouseup handler to ensure drag selection ends even if mouse is released outside grid
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isDragging, dragStartCell, dragEndCell, grid, batchMode]);

  return (
    <div 
      className={`relative overflow-auto ${loading ? "opacity-70 pointer-events-none" : ""} ${isDragging ? "select-none" : ""}`}
      onMouseLeave={handleMouseLeave}
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
              if (!cell) return <div key={dIdx} className="p-2 h-12 border-r"></div>;
              
              const isProcessing = isCellProcessing(cell.scheduleId);
              
              return (
                <div key={`${dIdx}-${hour}`}>
                  <InteractiveGridCell
                    cell={cell}
                    inDragSelection={isCellInDragSelection(dIdx, hour)}
                    onMouseDown={(e) => handleMouseDown(dIdx, hour, e)}
                    onMouseOver={(e) => handleMouseOver(dIdx, hour, e)}
                    onClick={() => handleCellClick(dIdx, hour)}
                    isProcessing={isProcessing}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
