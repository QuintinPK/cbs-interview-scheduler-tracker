
import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface WeekNavigatorProps {
  weekStart?: Date;
  weekEnd?: Date;
  currentWeek?: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({ 
  weekStart, 
  weekEnd, 
  currentWeek, 
  onPreviousWeek, 
  onNextWeek, 
  onCurrentWeek 
}) => {
  // Format the current week display
  const formattedWeek = weekStart && weekEnd 
    ? `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}` 
    : currentWeek;
  
  return (
    <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg shadow-sm border">
      <Button variant="outline" size="sm" onClick={onPreviousWeek}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous Week
      </Button>
      
      <div className="font-medium">
        {formattedWeek}
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCurrentWeek}>
          <Calendar className="h-4 w-4 mr-1" />
          Current Week
        </Button>
        
        <Button variant="outline" size="sm" onClick={onNextWeek}>
          Next Week
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
