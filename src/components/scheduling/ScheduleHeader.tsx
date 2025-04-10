
import React, { memo } from "react";
import { format, parseISO } from "date-fns";

interface ScheduleHeaderProps {
  days: string[];
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = memo(({ days }) => {
  return (
    <div className="grid grid-cols-[180px_repeat(7,1fr)]">
      <div className="border-b border-border p-2"></div>
      {days.map((day) => (
        <div key={day} className="border-b border-border p-2 text-center font-medium">
          {format(parseISO(day), "EEE")}<br />
          {format(parseISO(day), "MMM d")}
        </div>
      ))}
    </div>
  );
});

ScheduleHeader.displayName = "ScheduleHeader";

export default ScheduleHeader;
