
import React from "react";
import { format, addDays, subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onResetToToday: () => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onDateChange,
  onResetToToday,
}) => {
  const navigateToPreviousDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const navigateToNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-2 bg-white p-4 rounded-lg border mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={navigateToPreviousDay}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="font-medium">
                {formatInTimeZone(currentDate, 'America/Puerto_Rico', "EEEE, MMMM d, yyyy")}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        <Button
          variant="outline"
          size="icon"
          onClick={navigateToNextDay}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <Button
        variant="outline"
        onClick={onResetToToday}
        className="w-full md:w-auto"
      >
        Today
      </Button>
    </div>
  );
};
