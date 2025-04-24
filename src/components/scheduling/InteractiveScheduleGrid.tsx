import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay, getHours, parseISO, getMinutes, addHours } from 'date-fns';
import { Schedule, Session } from '@/types';
import { InteractiveGridCell } from './InteractiveGridCell';
import { useScheduleOperations } from '@/hooks/useScheduleOperations';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  sessionSpanData?: {
    isStart: boolean;
    isEnd: boolean;
    actualStartTime: Date;
    actualEndTime: Date;
    startMinuteOffset: number;
    endMinuteOffset: number;
    isFullHour: boolean;
    isMiddleHour?: boolean;
    spanId: string;
  };
}

export const InteractiveScheduleGrid: React.FC<InteractiveScheduleGridProps> = ({
  weekDates,
  interviewerId,
  schedules,
  sessions,
  hours = Array.from({ length: 13 }, (_, i) => i + 8),
  onSchedulesChanged
}) => {
  const [showRealised, setShowRealised] = useState(true);
  
  const [grid, setGrid] = useState<CellData[][]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{ dayIndex: number, hour: number } | null>(null);
  const [dragEndCell, setDragEndCell] = useState<{ dayIndex: number, hour: number } | null>(null);
  const [dragMode, setDragMode] = useState<'schedule' | 'unschedule' | null>(null);
  const [dragSelectionCells, setDragSelectionCells] = useState<Set<string>>(new Set());
  
  const [processingCellKeys, setProcessingCellKeys] = useState<Set<string>>(new Set());
  const [transitioningCellKeys, setTransitioningCellKeys] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const { isProcessing, addSchedulesBatch, deleteSchedulesBatch } = useScheduleOperations();
  
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newGrid: CellData[][] = [];
    
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
    
    sessions.forEach(session => {
      if (!session.start_time || !session.end_time) return;
      
      const sessionStart = new Date(session.start_time);
      const sessionEnd = new Date(session.end_time);
      const sessionSpanId = session.id;
      
      const dayIndex = weekDates.findIndex(date => 
        format(date, 'yyyy-MM-dd') === format(sessionStart, 'yyyy-MM-dd')
      );
      
      if (dayIndex < 0) return;
      
      const startHour = sessionStart.getHours();
      const endHour = sessionEnd.getHours();
      const spanningMultipleHours = startHour !== endHour;
      
      if (!spanningMultipleHours && hours.includes(startHour)) {
        const startMinuteOffset = getMinutes(sessionStart);
        const endMinuteOffset = getMinutes(sessionEnd);
        
        newGrid[dayIndex][startHour] = {
          ...newGrid[dayIndex][startHour],
          isSession: true,
          sessionId: session.id,
          session,
          sessionSpanData: {
            isStart: true,
            isEnd: true,
            actualStartTime: sessionStart,
            actualEndTime: sessionEnd,
            startMinuteOffset,
            endMinuteOffset,
            isFullHour: startMinuteOffset === 0 && endMinuteOffset === 60,
            spanId: sessionSpanId
          }
        };
        return;
      }
      
      for (let hour = Math.min(...hours); hour <= Math.max(...hours); hour++) {
        if (!hours.includes(hour)) continue;
        
        const hourStart = new Date(sessionStart);
        hourStart.setHours(hour, 0, 0, 0);
        
        const hourEnd = new Date(sessionStart);
        hourEnd.setHours(hour + 1, 0, 0, 0);
        
        const isStartHour = hour === startHour;
        const isEndHour = hour === endHour;
        const isMiddleHour = hour > startHour && hour < endHour;
        
        if (hour < startHour || hour > endHour) continue;
        
        let startMinuteOffset = 0;
        let endMinuteOffset = 60;
        
        if (isStartHour) {
          startMinuteOffset = getMinutes(sessionStart);
        }
        
        if (isEndHour) {
          endMinuteOffset = getMinutes(sessionEnd);
        }
        
        if (isEndHour && endMinuteOffset === 0) {
          continue;
        }
        
        newGrid[dayIndex][hour] = {
          ...newGrid[dayIndex][hour],
          isSession: true,
          sessionId: session.id,
          session,
          sessionSpanData: {
            isStart: isStartHour,
            isEnd: isEndHour,
            actualStartTime: sessionStart,
            actualEndTime: sessionEnd,
            startMinuteOffset,
            endMinuteOffset,
            isFullHour: !isStartHour && !isEndHour,
            isMiddleHour,
            spanId: sessionSpanId
          }
        };
      }
    });
    
    setGrid(newGrid);
    
    if (!isProcessing) {
      setProcessingCellKeys(new Set());
      setTransitioningCellKeys(new Set());
    }
  }, [weekDates, schedules, sessions, hours, isProcessing]);

  const handleMouseDown = (dayIndex: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    const cellKey = `${dayIndex}-${hour}`;
    const cell = grid[dayIndex]?.[hour];
    
    if (!cell) return;
    
    setIsDragging(true);
    setDragStartCell({ dayIndex, hour });
    setDragEndCell({ dayIndex, hour });
    
    const newDragMode = cell.isScheduled ? 'unschedule' : 'schedule';
    setDragMode(newDragMode);
    
    const newSelection = new Set<string>();
    newSelection.add(cellKey);
    setDragSelectionCells(newSelection);
  };

  const handleMouseOver = (dayIndex: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isDragging) {
      setDragEndCell({ dayIndex, hour });
      
      if (dragStartCell) {
        const minDay = Math.min(dragStartCell.dayIndex, dayIndex);
        const maxDay = Math.max(dragStartCell.dayIndex, dayIndex);
        const minHour = Math.min(dragStartCell.hour, hour);
        const maxHour = Math.max(dragStartCell.hour, hour);
        
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
      setTransitioningCellKeys(new Set([...dragSelectionCells]));
      
      if (dragMode === 'schedule') {
        const cellsToSchedule = Array.from(dragSelectionCells)
          .map(key => {
            const [dayIndex, hour] = key.split('-').map(Number);
            return grid[dayIndex]?.[hour];
          })
          .filter(cell => cell && !cell.isScheduled);
        
        const newSchedules = cellsToSchedule.map(cell => ({
          interviewer_id: interviewerId,
          start_time: cell!.startTime.toISOString(),
          end_time: cell!.endTime.toISOString(),
          status: 'scheduled' as const,
        }));
        
        if (newSchedules.length > 0) {
          const processingKeys = new Set(cellsToSchedule.map(cell => `${cell!.dayIndex}-${cell!.hour}`));
          setProcessingCellKeys(processingKeys);
          
          await addSchedulesBatch(newSchedules);
        }
      } else {
        const cellsToUnschedule = Array.from(dragSelectionCells)
          .map(key => {
            const [dayIndex, hour] = key.split('-').map(Number);
            return grid[dayIndex]?.[hour];
          })
          .filter(cell => cell && cell.isScheduled && cell.scheduleId);
        
        const scheduleIds = cellsToUnschedule.map(cell => cell!.scheduleId!);
        
        if (scheduleIds.length > 0) {
          const processingKeys = new Set(cellsToUnschedule.map(cell => `${cell!.dayIndex}-${cell!.hour}`));
          setProcessingCellKeys(processingKeys);
          
          await deleteSchedulesBatch(scheduleIds);
        }
      }
      
      onSchedulesChanged();
      
    } catch (error) {
      console.error("Error processing drag selection:", error);
      toast({
        title: "Error",
        description: "Failed to process scheduling changes",
        variant: "destructive",
      });
    } finally {
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
      setDragSelectionCells(new Set());
      setDragMode(null);
      
      setTimeout(() => {
        setTransitioningCellKeys(new Set());
      }, 300);
    }
  };

  const handleCellClick = async (dayIndex: number, hour: number) => {
    if (isProcessing || isDragging) return;
    
    const cell = grid[dayIndex]?.[hour];
    if (!cell) return;
    
    const cellKey = `${dayIndex}-${hour}`;
    
    try {
      setTransitioningCellKeys(new Set([cellKey]));
      
      if (cell.isScheduled && cell.scheduleId) {
        setProcessingCellKeys(new Set([cellKey]));
        await deleteSchedulesBatch([cell.scheduleId]);
      } else if (!cell.isScheduled) {
        setProcessingCellKeys(new Set([cellKey]));
        await addSchedulesBatch([{
          interviewer_id: interviewerId,
          start_time: cell.startTime.toISOString(),
          end_time: cell.endTime.toISOString(),
          status: 'scheduled',
        }]);
      }
      
      onSchedulesChanged();
      
    } catch (error) {
      console.error("Error processing cell click:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setTransitioningCellKeys(new Set());
      }, 300);
    }
  };

  const isCellInDragSelection = (dayIndex: number, hour: number) => {
    return dragSelectionCells.has(`${dayIndex}-${hour}`);
  };

  const isCellProcessing = (dayIndex: number, hour: number) => {
    return processingCellKeys.has(`${dayIndex}-${hour}`);
  };

  const isCellTransitioning = (dayIndex: number, hour: number) => {
    return transitioningCellKeys.has(`${dayIndex}-${hour}`);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
      setDragSelectionCells(new Set());
      setDragMode(null);
    }
  };

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
    <div className="space-y-4">
      <div className="flex items-center space-x-2 ml-auto w-fit">
        <Switch 
          id="show-realised" 
          checked={showRealised}
          onCheckedChange={setShowRealised}
        />
        <Label htmlFor="show-realised">Show realised sessions</Label>
      </div>
      
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
            <div key={hour} className={`grid grid-cols-[100px_repeat(7,1fr)] border-b ${hour % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
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
                      showRealised={showRealised}
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
    </div>
  );
};
