import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export interface WeekNavigatorProps {
  weekStart: Date;
  weekEnd: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  weekStart,
  weekEnd,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <Button variant="outline" size="sm" onClick={onPreviousWeek}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous Week
        </Button>
      </div>
      
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold">
          {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCurrentWeek}>
          <Calendar className="mr-2 h-4 w-4" />
          Current Week
        </Button>
      </div>
      
      <div>
        <Button variant="outline" size="sm" onClick={onNextWeek}>
          Next Week
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
