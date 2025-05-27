
import React, { useState, useEffect } from "react";
import { Interviewer, Schedule } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Save, X } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface InteractiveScheduleGridProps {
  schedules: Schedule[];
  interviewers: Interviewer[];
  onSaveSchedules: (schedules: Omit<Schedule, "id">[]) => Promise<void>;
  onCancelSchedules: () => void;
  selectedTimeSlots: { [key: string]: string[] };
  onTimeSlotToggle: (interviewerId: string, timeSlot: string) => void;
  className?: string;
}

const InteractiveScheduleGrid: React.FC<InteractiveScheduleGridProps> = ({
  schedules,
  interviewers,
  onSaveSchedules,
  onCancelSchedules,
  selectedTimeSlots,
  onTimeSlotToggle,
  className
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [hasChanges, setHasChanges] = useState(false);

  // Generate week days starting from Monday
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Time slots for each day (9 AM to 5 PM)
  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  // Check if there are any selected time slots
  useEffect(() => {
    const hasAnySelection = Object.values(selectedTimeSlots).some(slots => slots.length > 0);
    setHasChanges(hasAnySelection);
  }, [selectedTimeSlots]);

  // Get existing schedule for specific interviewer and time
  const getExistingSchedule = (interviewerId: string, date: Date, time: string): Schedule | undefined => {
    const targetDateTime = `${format(date, 'yyyy-MM-dd')}T${time}:00`;
    return schedules.find(schedule => 
      schedule.interviewer_id === interviewerId &&
      schedule.start_time.startsWith(format(date, 'yyyy-MM-dd')) &&
      schedule.start_time.includes(time)
    );
  };

  // Check if time slot is selected
  const isTimeSlotSelected = (interviewerId: string, date: Date, time: string): boolean => {
    const slotKey = `${format(date, 'yyyy-MM-dd')}T${time}:00`;
    return selectedTimeSlots[interviewerId]?.includes(slotKey) || false;
  };

  // Get status badge for time slot
  const getTimeSlotStatus = (interviewerId: string, date: Date, time: string) => {
    const existing = getExistingSchedule(interviewerId, date, time);
    const isSelected = isTimeSlotSelected(interviewerId, date, time);

    if (existing) {
      return (
        <Badge variant={existing.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
          {existing.status}
        </Badge>
      );
    }

    if (isSelected) {
      return <Badge variant="outline" className="text-xs bg-blue-50">Selected</Badge>;
    }

    return null;
  };

  // Handle time slot click
  const handleTimeSlotClick = (interviewerId: string, date: Date, time: string) => {
    const existing = getExistingSchedule(interviewerId, date, time);
    
    // Don't allow modification of existing schedules
    if (existing) return;

    const slotKey = `${format(date, 'yyyy-MM-dd')}T${time}:00`;
    onTimeSlotToggle(interviewerId, slotKey);
  };

  // Handle save all selected schedules
  const handleSaveSchedules = async () => {
    const newSchedules: Omit<Schedule, "id">[] = [];

    Object.entries(selectedTimeSlots).forEach(([interviewerId, slots]) => {
      slots.forEach(slot => {
        const endTime = new Date(slot);
        endTime.setHours(endTime.getHours() + 1); // 1 hour duration

        newSchedules.push({
          interviewer_id: interviewerId,
          start_time: slot,
          end_time: endTime.toISOString(),
          status: "scheduled",
          created_at: new Date().toISOString()
        });
      });
    });

    await onSaveSchedules(newSchedules);
    setHasChanges(false);
  };

  // Handle cancel
  const handleCancel = () => {
    onCancelSchedules();
    setHasChanges(false);
  };

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Planning
          </CardTitle>
          
          {hasChanges && (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSaveSchedules} size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save Schedules
              </Button>
            </div>
          )}
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button onClick={goToPreviousWeek} variant="outline" size="sm">
            Previous Week
          </Button>
          
          <div className="flex flex-col items-center">
            <span className="font-medium">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button onClick={goToCurrentWeek} variant="ghost" size="sm">
              Today
            </Button>
          </div>
          
          <Button onClick={goToNextWeek} variant="outline" size="sm">
            Next Week
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-2 min-w-max">
            {/* Header Row */}
            <div className="font-medium text-sm p-2">Interviewer</div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="font-medium text-sm p-2 text-center">
                <div>{format(day, 'EEE')}</div>
                <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
              </div>
            ))}

            {/* Interviewer Rows */}
            {interviewers.map(interviewer => (
              <React.Fragment key={interviewer.id}>
                {/* Interviewer Name */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{interviewer.code}</span>
                </div>

                {/* Days for this interviewer */}
                {weekDays.map(day => (
                  <div key={`${interviewer.id}-${day.toISOString()}`} className="p-1">
                    <div className="space-y-1">
                      {timeSlots.map(time => {
                        const existing = getExistingSchedule(interviewer.id, day, time);
                        const isSelected = isTimeSlotSelected(interviewer.id, day, time);
                        const isClickable = !existing;

                        return (
                          <div
                            key={time}
                            className={cn(
                              "p-1 rounded text-xs cursor-pointer transition-colors",
                              isClickable && "hover:bg-blue-100",
                              isSelected && "bg-blue-200 border-blue-400",
                              existing && "bg-gray-100 cursor-not-allowed",
                              !isClickable && !existing && "hover:bg-gray-50"
                            )}
                            onClick={() => handleTimeSlotClick(interviewer.id, day, time)}
                          >
                            <div className="flex items-center justify-between">
                              <Clock className="h-3 w-3" />
                              <span>{time}</span>
                            </div>
                            {getTimeSlotStatus(interviewer.id, day, time)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span>Existing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-300 rounded"></div>
            <span>Available</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveScheduleGrid;
