
import React, { useState, useCallback, useMemo } from "react";
import ScheduleHeader from "./ScheduleHeader";
import ScheduleTimeslots from "./ScheduleTimeslots";
import ScheduleRow from "./ScheduleRow";
import { Interviewer } from "@/types";

interface ScheduleGridProps {
  days: string[];
  timeslots: string[];
  interviewers: Interviewer[];
  schedules: any[];
  onCellSelect: (interviewerId: string, day: string, timeslot: string) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  days,
  timeslots,
  interviewers,
  schedules,
  onCellSelect
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    interviewerId: string;
    day: string;
    timeslot: string;
  } | null>(null);

  // Process schedules to optimize rendering
  const processedSchedules = useMemo(() => {
    return schedules.map(schedule => ({
      interviewer_id: schedule.interviewer_id,
      day: schedule.day,
      timeslot: schedule.timeslot
    }));
  }, [schedules]);

  const handleCellClick = useCallback((interviewerId: string, day: string, timeslot: string) => {
    setSelectedCell({ interviewerId, day, timeslot });
    onCellSelect(interviewerId, day, timeslot);
  }, [onCellSelect]);

  return (
    <div className="overflow-auto">
      <div className="min-w-[1000px]">
        {/* Header row with days */}
        <ScheduleHeader days={days} />

        {/* Grid with interviewers and timeslots */}
        <div className="grid grid-cols-[180px_repeat(7,1fr)]">
          {/* First column with timeslots */}
          <div className="space-y-0">
            <div className="p-2 border-r border-border font-medium">Interviewers</div>
            {interviewers.map((interviewer) => (
              <React.Fragment key={interviewer.id}>
                {timeslots.map((timeslot, timeIdx) => (
                  <div 
                    key={`${interviewer.id}-${timeIdx}`} 
                    className="border-b border-r border-border p-2"
                  >
                    {timeIdx === 0 && (
                      <div className="font-medium">
                        {interviewer.first_name} {interviewer.last_name && interviewer.last_name.charAt(0)}.
                      </div>
                    )}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Time labels */}
          <div className="col-span-7 grid grid-cols-7">
            {interviewers.map((interviewer) => (
              <React.Fragment key={interviewer.id}>
                {timeslots.map((timeslot, timeIdx) => (
                  <React.Fragment key={`${interviewer.id}-${timeIdx}`}>
                    {timeIdx === 0 && (
                      <div className="col-span-7 grid grid-cols-7 border-b border-border">
                        <ScheduleTimeslots timeslots={timeslots} />
                      </div>
                    )}
                    <ScheduleRow
                      interviewer={interviewer}
                      days={days}
                      timeslot={timeslot}
                      schedules={processedSchedules}
                      selectedCell={selectedCell}
                      onCellClick={handleCellClick}
                    />
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;
