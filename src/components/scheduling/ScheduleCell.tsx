
import React, { memo } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Interviewer } from "@/types";

interface ScheduleCellProps {
  interviewer: Interviewer;
  day: string;
  timeslot: string;
  hasSchedule: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const ScheduleCell: React.FC<ScheduleCellProps> = memo(({
  interviewer,
  day,
  timeslot,
  hasSchedule,
  isSelected,
  onClick
}) => {
  return (
    <div
      className={cn(
        "border border-border p-2 h-12 min-w-[120px] flex items-center justify-center cursor-pointer transition-colors",
        hasSchedule ? "bg-cbs text-white hover:bg-cbs-light" : "hover:bg-gray-100",
        isSelected && !hasSchedule ? "bg-blue-100" : "",
      )}
      onClick={onClick}
      data-interviewer-id={interviewer.id}
      data-day={day}
      data-timeslot={timeslot}
    >
      {hasSchedule && (
        <Calendar className="h-4 w-4 mr-1" />
      )}
    </div>
  );
});

ScheduleCell.displayName = "ScheduleCell";

export default ScheduleCell;
