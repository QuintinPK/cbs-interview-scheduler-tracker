
import React, { useState, useEffect, useRef } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { Schedule, Session } from "@/types";
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
  const [processingCells, setProcessingCells] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState<'schedule' | 'unschedule' | null>(null);
  const [currentlyProcessingBatch, setCurrentlyProcessingBatch] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedCellsRef = useRef<{[key: string]: boolean}>({});

  // Build grid from schedules and sessions
  useEffect(() => {
    if (viewMode === "day") {
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
            session: session,
          };
        }
      });

      setGrid(newGrid);
    } 
    else if (viewMode === "week" && weekDates && interviewers.length > 0) {
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
              session: session,
            };
          }
        });
      });

      setGrid(newGrid);
    }
  }, [currentDate, weekDates, interviewers, schedules, sessions, viewMode, hours]);

  // Clear processing cells when schedules or sessions change
  useEffect(() => {
    if (!currentlyProcessingBatch) {
      setProcessingCells([]);
      setBatchMode(null);
    }
  }, [schedules, sessions, currentlyProcessingBatch]);

  const handleMouseDown = (interviewerId: string, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setIsDragging(true);
    setDragStartCell({ interviewerId, hour });
    setDragEndCell({ interviewerId, hour });
    
    // Reset selected cells tracking
    selectedCellsRef.current = {};
    
    // Determine operation type based on first cell
    const cell = grid[interviewerId][hour];
    if (cell?.isScheduled) {
      setBatchMode('unschedule');
    } else {
      setBatchMode('schedule');
    }
  };

  const handleMouseOver = (interviewerId: string, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging) {
      setDragEndCell({ interviewerId, hour });
      
      // Track this cell as part of the selection
      const cellKey = `${interviewerId}-${hour}`;
      selectedCellsRef.current[cellKey] = true;
    }
  };

  const handleMouseUp = async () => {
    if (!isDragging || !dragStartCell || !dragEndCell) return;
    
    setLoading(true);
    setCurrentlyProcessingBatch(true);
    
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

      if (batchMode === 'unschedule') {
        // Mark cells as processing
        const processingIds = selectedCells
          .filter(({ cell }) => cell.isScheduled && cell.scheduleId)
          .map(({ cell }) => cell.scheduleId as string);
        setProcessingCells(processingIds);
        
        // Create a temporary grid for visual updates
        const tempGrid = { ...grid };
        
        // Process unschedule operations one by one
        for (const { interviewerId, hour, cell } of selectedCells) {
          if (cell.isScheduled && cell.scheduleId) {
            // Immediately update UI to show this cell as unscheduled
            if (tempGrid[interviewerId] && tempGrid[interviewerId][hour]) {
              tempGrid[interviewerId][hour] = {
                ...tempGrid[interviewerId][hour],
                isScheduled: false,
                scheduleId: undefined,
                status: undefined,
                notes: undefined
              };
            }
            
            // Update the grid for immediate visual feedback
            setGrid({ ...tempGrid });
            
            // Perform actual unschedule operation
            await onUnscheduleSlot(cell.scheduleId);
          }
        }
      } 
      else {
        const addOps = [];
        // Create a temporary grid for visual updates
        const tempGrid = { ...grid };
        
        for (const { interviewerId, hour, cell } of selectedCells) {
          if (!cell.isScheduled) {
            // Immediately update UI to show this cell as scheduled
            if (tempGrid[interviewerId] && tempGrid[interviewerId][hour]) {
              tempGrid[interviewerId][hour] = {
                ...tempGrid[interviewerId][hour],
                isScheduled: true,
                status: 'scheduled'
              };
            }
            
            addOps.push(onScheduleSlot(interviewerId, cell.startTime, cell.endTime));
          }
        }
        
        // Update the grid for immediate feedback
        setGrid({ ...tempGrid });
        
        // Execute actual operations
        await Promise.all(addOps);
      }
    } catch (error) {
      console.error("Error processing batch schedule operation:", error);
    } finally {
      setLoading(false);
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
      setProcessingCells([]);
      setBatchMode(null);
      setCurrentlyProcessingBatch(false);
      selectedCellsRef.current = {};
    }
  };

  const handleCellClick = async (interviewerId: string, hour: number) => {
    if (loading) return;
    
    const cell = grid[interviewerId][hour];
    setLoading(true);
    
    try {
      if (cell.isScheduled && cell.scheduleId) {
        setProcessingCells([cell.scheduleId]);
        
        // Immediately update UI
        const tempGrid = { ...grid };
        if (tempGrid[interviewerId] && tempGrid[interviewerId][hour]) {
          tempGrid[interviewerId][hour] = {
            ...tempGrid[interviewerId][hour],
            isScheduled: false,
            scheduleId: undefined,
            status: undefined,
            notes: undefined
          };
        }
        setGrid({ ...tempGrid });
        
        await onUnscheduleSlot(cell.scheduleId);
      } else {
        // Immediately update UI
        const tempGrid = { ...grid };
        if (tempGrid[interviewerId] && tempGrid[interviewerId][hour]) {
          tempGrid[interviewerId][hour] = {
            ...tempGrid[interviewerId][hour],
            isScheduled: true,
            status: 'scheduled'
          };
        }
        setGrid({ ...tempGrid });
        
        await onScheduleSlot(interviewerId, cell.startTime, cell.endTime);
      }
    } catch (error) {
      console.error("Error toggling schedule:", error);
    } finally {
      setLoading(false);
      setProcessingCells([]);
    }
  };

  const handleMouseDownWeek = (dayIdx: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setIsDragging(true);
    setDragStartCell({ dayIdx, hour });
    setDragEndCell({ dayIdx, hour });
    
    // Reset selected cells tracking
    selectedCellsRef.current = {};
    
    // Determine operation type based on first cell
    const cell = grid[dayIdx][hour];
    if (cell?.isScheduled) {
      setBatchMode('unschedule');
    } else {
      setBatchMode('schedule');
    }
  };

  const handleMouseOverWeek = (dayIdx: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging) {
      setDragEndCell({ dayIdx, hour });
      
      // Track this cell as part of the selection
      const cellKey = `${dayIdx}-${hour}`;
      selectedCellsRef.current[cellKey] = true;
    }
  };

  const handleMouseUpWeek = async () => {
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
        // Mark cells as processing
        const processingIds = selectedCells
          .filter(({ cell }) => cell.isScheduled && cell.scheduleId)
          .map(({ cell }) => cell.scheduleId as string);
        setProcessingCells(processingIds);
        
        // Create a temporary grid for visual updates
        const tempGrid = { ...grid };
        
        // Process unschedule operations one by one
        for (const { dayIdx, hour, cell } of selectedCells) {
          if (cell.isScheduled && cell.scheduleId) {
            // Immediately update UI
            if (tempGrid[dayIdx] && tempGrid[dayIdx][hour]) {
              tempGrid[dayIdx][hour] = {
                ...tempGrid[dayIdx][hour],
                isScheduled: false,
                scheduleId: undefined,
                status: undefined,
                notes: undefined
              };
            }
            
            // Update the grid for immediate feedback
            setGrid({ ...tempGrid });
            
            await onUnscheduleSlot(cell.scheduleId);
          }
        }
      } 
      else {
        const addOps = [];
        // Create a temporary grid for visual updates
        const tempGrid = { ...grid };
        
        for (const { dayIdx, hour, cell } of selectedCells) {
          if (!cell.isScheduled && interviewers.length > 0) {
            // Immediately update UI
            if (tempGrid[dayIdx] && tempGrid[dayIdx][hour]) {
              tempGrid[dayIdx][hour] = {
                ...tempGrid[dayIdx][hour],
                isScheduled: true,
                status: 'scheduled'
              };
            }
            
            addOps.push(onScheduleSlot(interviewers[0].id, cell.startTime, cell.endTime));
          }
        }
        
        // Update the grid for immediate feedback
        setGrid({ ...tempGrid });
        
        await Promise.all(addOps);
      }
    } catch (error) {
      console.error("Error processing batch schedule operation:", error);
    } finally {
      setLoading(false);
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
      setProcessingCells([]);
      setBatchMode(null);
      setCurrentlyProcessingBatch(false);
      selectedCellsRef.current = {};
    }
  };

  const handleCellClickWeek = async (dayIdx: number, hour: number) => {
    if (loading || interviewers.length === 0) return;
    
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
        setGrid({ ...tempGrid });
        
        await onUnscheduleSlot(cell.scheduleId);
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
        setGrid({ ...tempGrid });
        
        await onScheduleSlot(interviewers[0].id, cell.startTime, cell.endTime);
      }
    } catch (error) {
      console.error("Error toggling schedule:", error);
    } finally {
      setLoading(false);
      setProcessingCells([]);
    }
  };

  const isCellInDragSelection = (interviewerId: string, hour: number) => {
    if (!isDragging || !dragStartCell || !dragEndCell) return false;
    
    if (!dragStartCell.hasOwnProperty('interviewerId')) return false;
    
    const startInterviewerIndex = interviewers.findIndex(i => i.id === dragStartCell.interviewerId);
    const endInterviewerIndex = interviewers.findIndex(i => i.id === dragEndCell.interviewerId);
    const currentInterviewerIndex = interviewers.findIndex(i => i.id === interviewerId);
    
    if (startInterviewerIndex === -1 || endInterviewerIndex === -1 || currentInterviewerIndex === -1)
      return false;
    
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
    
    if (!dragStartCell.hasOwnProperty('dayIdx')) return false;
    
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

  // Add document mouseup handler to ensure drag selection ends even if mouse is released outside grid
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      if (isDragging) {
        if (viewMode === "day") {
          handleMouseUp();
        } else {
          handleMouseUpWeek();
        }
      }
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isDragging, dragStartCell, dragEndCell, viewMode, batchMode, grid]);

  if (viewMode === "week" && weekDates && interviewers.length > 0) {
    return (
      <div
        className={`relative overflow-x-auto ${loading ? "opacity-70 pointer-events-none" : ""} ${isDragging ? "select-none" : ""}`}
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
                      inDragSelection={isCellInDragSelectionWeek(dIdx, hour)}
                      onMouseDown={(e) => handleMouseDownWeek(dIdx, hour, e)}
                      onMouseOver={(e) => handleMouseOverWeek(dIdx, hour, e)}
                      onClick={() => handleCellClickWeek(dIdx, hour)}
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
  }

  return (
    <div 
      className={`relative overflow-x-auto ${loading ? 'opacity-70 pointer-events-none' : ''} ${isDragging ? 'select-none' : ''}`}
      onMouseLeave={handleMouseLeave}
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
              if (!cell) return <div key={hour} className="p-2 h-12 border-r"></div>;
              
              const isProcessing = isCellProcessing(cell.scheduleId);
              
              return (
                <div key={`${interviewer.id}-${hour}`}>
                  <InteractiveGridCell
                    key={`${interviewer.id}-${hour}`}
                    cell={cell}
                    inDragSelection={isCellInDragSelection(interviewer.id, hour)}
                    onMouseDown={(e) => handleMouseDown(interviewer.id, hour, e)}
                    onMouseOver={(e) => handleMouseOver(interviewer.id, hour, e)}
                    onClick={() => handleCellClick(interviewer.id, hour)}
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
