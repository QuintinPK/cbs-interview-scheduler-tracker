
import React, { memo } from "react";
import { format } from "date-fns";

interface ScheduleTimeslotsProps {
  timeslots: string[];
}

const ScheduleTimeslots: React.FC<ScheduleTimeslotsProps> = memo(({ timeslots }) => {
  return (
    <>
      {timeslots.map((timeslot) => (
        <div key={timeslot} className="border-b border-r border-border p-2 font-medium">
          {format(new Date(`2000-01-01T${timeslot}`), "h:mm a")}
        </div>
      ))}
    </>
  );
});

ScheduleTimeslots.displayName = "ScheduleTimeslots";

export default ScheduleTimeslots;
