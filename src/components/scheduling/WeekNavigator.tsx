
import React from "react";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeekNavigatorProps {
  currentWeekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
  onResetToCurrentWeek: () => void;
}

export const WeekNavigator = ({
  currentWeekStart,
  onWeekChange,
  onResetToCurrentWeek,
}: WeekNavigatorProps) => {
  const prevWeek = () => {
    onWeekChange(addDays(currentWeekStart, -7));
  };
  
  const nextWeek = () => {
    onWeekChange(addDays(currentWeekStart, 7));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={prevWeek}>
          <ArrowLeft size={16} className="mr-1" />
          Previous Week
        </Button>
        
        <div className="text-center">
          <h2 className="font-medium text-lg">
            {format(currentWeekStart, "MMMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMMM d, yyyy")}
          </h2>
          <Button variant="link" onClick={onResetToCurrentWeek} className="text-cbs">
            <Calendar size={14} className="mr-1" />
            Current Week
          </Button>
        </div>
        
        <Button variant="outline" onClick={nextWeek}>
          Next Week
          <ArrowRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
};
