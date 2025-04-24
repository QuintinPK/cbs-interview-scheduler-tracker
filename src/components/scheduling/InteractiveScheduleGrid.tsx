
import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { Schedule, Session } from '@/types';
import { InteractiveGridCell } from './InteractiveGridCell';
import { useScheduleOperations } from '@/hooks/useScheduleOperations';
import { useToast } from '@/hooks/use-toast';

interface InteractiveScheduleGridProps {
  weekDates: Date[];
  interviewerId: string;
  schedules: Schedule[];
  sessions: Session[];
  hours?: number[];
  onSchedulesChanged: () => void;
}

interface CellData {
  dayIndex: number;
  hour: number;
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

export const InteractiveScheduleGrid: React.FC<InteractiveScheduleGridProps> = ({
  weekDates,
  interviewerId,
  schedules,
  sessions,
  hours = Array.from({ length: 13 }, (_, i) => i + 8), // 8:00 to 20:00
  onSchedulesChanged
}) => {
  // State for grid data
  const [grid, setGrid] = useState<CellData[][]>([]);
  
  // State for drag selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{ dayIndex: number, hour: number } | null>(null);
  const [dragEndCell, setDragEndCell] = useState<{ dayIndex: number, hour: number } | null>(null);
  const [dragMode, setDragMode] = useState<'schedule' | 'unschedule' | null>(null);
  const [dragSelectionCells, setDragSelectionCells] = useState<Set<string>>(new Set());
  
  // Visual feedback states
  const [processingCellKeys, setProcessingCellKeys] = useState<Set<string>>(new Set());
  const [transitioningCellKeys, setTransitioningCellKeys] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const { isProcessing, addSchedulesBatch, deleteSchedulesBatch } = useScheduleOperations();
  
  // References
  const gridRef = useRef<HTMLDivElement>(null);

  // Build the initial grid from schedules and sessions
  useEffect(() => {
    const newGrid: CellData[][] = [];
    
    // Initialize empty grid
    weekDates.forEach((date, dayIndex) => {
      newGrid[dayIndex] = [];
      
      hours.forEach(hour => {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        newGrid[dayIndex][hour] = {
          dayIndex,
          hour,
          isScheduled: false,
          isSession: false,
          startTime,
          endTime,
        };
      });
    });
    
    // Add scheduled slots
    schedules.forEach(schedule => {
      const startTime = new Date(schedule.start_time);
      const dayIndex = weekDates.findIndex(date => isSameDay(date, startTime));
      const hour = startTime.getHours();
      
      if (dayIndex >= 0 && hours.includes(hour)) {
        newGrid[dayIndex][hour] = {
          ...newGrid[dayIndex][hour],
          isScheduled: true,
          scheduleId: schedule.id,
          status: schedule.status as 'scheduled' | 'completed' | 'cancelled',
          notes: schedule.notes
        };
      }
    });
    
    // Add sessions
    sessions.forEach(session => {
      if (!session.start_time) return;
      
      const startTime = new Date(session.start_time);
      const dayIndex = weekDates.findIndex(date => isSameDay(date, startTime));
      const hour = startTime.getHours();
      
      if (dayIndex >= 0 && hours.includes(hour)) {
        newGrid[dayIndex][hour] = {
          ...newGrid[dayIndex][hour],
          isSession: true,
          sessionId: session.id,
          session,
        };
      }
    });
    
    setGrid(newGrid);
    
    // Clear visual states when data changes
    if (!isProcessing) {
      setProcessingCellKeys(new Set());
      setTransitioningCellKeys(new Set());
    }
  }, [weekDates, schedules, sessions, hours, isProcessing]);

  // Handle mouse down - start drag selection
  const handleMouseDown = (dayIndex: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    const cellKey = `${dayIndex}-${hour}`;
    const cell = grid[dayIndex]?.[hour];
    
    if (!cell) return;
    
    setIsDragging(true);
    setDragStartCell({ dayIndex, hour });
    setDragEndCell({ dayIndex, hour });
    
    // Determine drag mode based on first cell
    const newDragMode = cell.isScheduled ? 'unschedule' : 'schedule';
    setDragMode(newDragMode);
    
    // Initialize selection set
    const newSelection = new Set<string>();
    newSelection.add(cellKey);
    setDragSelectionCells(newSelection);
  };

  // Handle mouse over during drag
  const handleMouseOver = (dayIndex: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isDragging) {
      setDragEndCell({ dayIndex, hour });
      
      if (dragStartCell) {
        // Calculate current selection rectangle
        const minDay = Math.min(dragStartCell.dayIndex, dayIndex);
        const maxDay = Math.max(dragStartCell.dayIndex, dayIndex);
        const minHour = Math.min(dragStartCell.hour, hour);
        const maxHour = Math.max(dragStartCell.hour, hour);
        
        // Collect all cells in the selection rectangle
        const newSelection = new Set<string>();
        
        for (let d = minDay; d <= maxDay; d++) {
          for (let h = minHour; h <= maxHour; h++) {
            if (grid[d]?.[h]) {
              const cellKey = `${d}-${h}`;
              newSelection.add(cellKey);
            }
          }
        }
        
        setDragSelectionCells(newSelection);
      }
    }
  };

  // Handle mouse up - end drag selection and process changes
  const handleMouseUp = async () => {
    if (!isDragging || !dragMode) {
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
      setDragSelectionCells(new Set());
      setDragMode(null);
      return;
    }
    
    try {
      // Prepare visual transition
      setTransitioningCellKeys(new Set([...dragSelectionCells]));
      
      // Process cells based on drag mode
      if (dragMode === 'schedule') {
        // Filter cells that need scheduling
        const cellsToSchedule = Array.from(dragSelectionCells)
          .map(key => {
            const [dayIndex, hour] = key.split('-').map(Number);
            return grid[dayIndex]?.[hour];
          })
          .filter(cell => cell && !cell.isScheduled);
        
        // Create schedule objects
        const newSchedules = cellsToSchedule.map(cell => ({
          interviewer_id: interviewerId,
          start_time: cell!.startTime.toISOString(),
          end_time: cell!.endTime.toISOString(),
          status: 'scheduled' as const,
        }));
        
        if (newSchedules.length > 0) {
          // Track cells being processed
          const processingKeys = new Set(cellsToSchedule.map(cell => `${cell!.dayIndex}-${cell!.hour}`));
          setProcessingCellKeys(processingKeys);
          
          // Perform batch operation
          await addSchedulesBatch(newSchedules);
        }
      } else {
        // Filter cells that need unscheduling
        const cellsToUnschedule = Array.from(dragSelectionCells)
          .map(key => {
            const [dayIndex, hour] = key.split('-').map(Number);
            return grid[dayIndex]?.[hour];
          })
          .filter(cell => cell && cell.isScheduled && cell.scheduleId);
        
        // Extract schedule IDs
        const scheduleIds = cellsToUnschedule.map(cell => cell!.scheduleId!);
        
        if (scheduleIds.length > 0) {
          // Track cells being processed
          const processingKeys = new Set(cellsToUnschedule.map(cell => `${cell!.dayIndex}-${cell!.hour}`));
          setProcessingCellKeys(processingKeys);
          
          // Perform batch operation
          await deleteSchedulesBatch(scheduleIds);
        }
      }
      
      // Notify parent component that schedules have been updated
      onSchedulesChanged();
      
    } catch (error) {
      console.error("Error processing drag selection:", error);
      toast({
        title: "Error",
        description: "Failed to process scheduling changes",
        variant: "destructive",
      });
    } finally {
      // Reset drag selection states
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
      setDragSelectionCells(new Set());
      setDragMode(null);
      
      // Clear visual states after a delay
      setTimeout(() => {
        setTransitioningCellKeys(new Set());
      }, 300);
    }
  };

  // Handle single cell click
  const handleCellClick = async (dayIndex: number, hour: number) => {
    if (isProcessing || isDragging) return;
    
    const cell = grid[dayIndex]?.[hour];
    if (!cell) return;
    
    const cellKey = `${dayIndex}-${hour}`;
    
    try {
      // Apply immediate visual transition
      setTransitioningCellKeys(new Set([cellKey]));
      
      if (cell.isScheduled && cell.scheduleId) {
        // Unschedule
        setProcessingCellKeys(new Set([cellKey]));
        await deleteSchedulesBatch([cell.scheduleId]);
      } else if (!cell.isScheduled) {
        // Schedule
        setProcessingCellKeys(new Set([cellKey]));
        await addSchedulesBatch([{
          interviewer_id: interviewerId,
          start_time: cell.startTime.toISOString(),
          end_time: cell.endTime.toISOString(),
          status: 'scheduled',
        }]);
      }
      
      // Notify parent component that schedules have been updated
      onSchedulesChanged();
      
    } catch (error) {
      console.error("Error processing cell click:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    } finally {
      // Clear visual states after a delay
      setTimeout(() => {
        setTransitioningCellKeys(new Set());
      }, 300);
    }
  };

  // Check if a cell is in the current drag selection
  const isCellInDragSelection = (dayIndex: number, hour: number) => {
    return dragSelectionCells.has(`${dayIndex}-${hour}`);
  };

  // Check if a cell is in processing state
  const isCellProcessing = (dayIndex: number, hour: number) => {
    return processingCellKeys.has(`${dayIndex}-${hour}`);
  };

  // Check if a cell is in transitioning state (visual feedback)
  const isCellTransitioning = (dayIndex: number, hour: number) => {
    return transitioningCellKeys.has(`${dayIndex}-${hour}`);
  };

  // Handle mouse leave to cancel drag operation
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
      setDragSelectionCells(new Set());
      setDragMode(null);
    }
  };

  // Global mouseup handler
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
  }, [isDragging, dragStartCell, dragEndCell, dragMode, dragSelectionCells, grid]);

  return (
    <div 
      className={`relative overflow-auto ${isProcessing ? "opacity-70" : ""} ${isDragging ? "select-none" : ""}`}
      onMouseLeave={handleMouseLeave}
      ref={gridRef}
    >
      <div className="min-w-full">
        <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
          <div className="p-2 text-center font-medium border-r">Time</div>
          {weekDates.map((date, dayIdx) => (
            <div key={dayIdx} className="p-2 text-center font-medium whitespace-nowrap">
              {format(date, "E, MMM d")}
            </div>
          ))}
        </div>
        
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
            <div className="p-2 border-r text-sm font-medium text-center">{hour}:00</div>
            {weekDates.map((_, dayIndex) => {
              const cell = grid[dayIndex]?.[hour];
              
              if (!cell) {
                return <div key={`empty-${dayIndex}-${hour}`} className="p-2 h-12 border-r"></div>;
              }
              
              const cellProcessing = isCellProcessing(dayIndex, hour);
              const cellInDragSelection = isCellInDragSelection(dayIndex, hour);
              const cellTransitioning = isCellTransitioning(dayIndex, hour);
              
              return (
                <div key={`${dayIndex}-${hour}`}>
                  <InteractiveGridCell
                    cell={cell}
                    inDragSelection={cellInDragSelection}
                    isProcessing={cellProcessing}
                    isTransitioning={cellTransitioning}
                    onMouseDown={(e) => handleMouseDown(dayIndex, hour, e)}
                    onMouseOver={(e) => handleMouseOver(dayIndex, hour, e)}
                    onClick={() => handleCellClick(dayIndex, hour)}
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
