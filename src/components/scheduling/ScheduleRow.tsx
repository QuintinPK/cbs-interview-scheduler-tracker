
import React, { memo } from "react";
import ScheduleCell from "./ScheduleCell";
import { Interviewer } from "@/types";

interface ScheduleRowProps {
  interviewer: Interviewer;
  days: string[];
  timeslot: string;
  schedules: any[];
  selectedCell: { interviewerId: string; day: string; timeslot: string } | null;
  onCellClick: (interviewerId: string, day: string, timeslot: string) => void;
}

const ScheduleRow: React.FC<ScheduleRowProps> = memo(({
  interviewer,
  days,
  timeslot,
  schedules,
  selectedCell,
  onCellClick
}) => {
  return (
    <>
      {days.map((day) => {
        const hasSchedule = schedules.some(
          (s) => 
            s.interviewer_id === interviewer.id && 
            s.day === day &&
            s.timeslot === timeslot
        );
        
        const isSelected = selectedCell?.interviewerId === interviewer.id && 
                          selectedCell?.day === day && 
                          selectedCell?.timeslot === timeslot;
        
        return (
          <ScheduleCell
            key={`${interviewer.id}-${day}-${timeslot}`}
            interviewer={interviewer}
            day={day}
            timeslot={timeslot}
            hasSchedule={hasSchedule}
            isSelected={isSelected}
            onClick={() => onCellClick(interviewer.id, day, timeslot)}
          />
        );
      })}
    </>
  );
});

ScheduleRow.displayName = "ScheduleRow";

export default ScheduleRow;
