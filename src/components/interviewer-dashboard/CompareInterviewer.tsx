
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Interviewer } from "@/types";

interface CompareInterviewerProps {
  comparableInterviewers: Interviewer[];
  onCompare: (interviewerId: string) => void;
  currentInterviewerId?: string;
}

export const CompareInterviewer: React.FC<CompareInterviewerProps> = ({
  comparableInterviewers,
  onCompare,
  currentInterviewerId
}) => {
  if (comparableInterviewers.length === 0) return null;

  return (
    <div className="flex gap-2 items-center">
      <p className="text-sm text-muted-foreground">Compare with:</p>
      <Select onValueChange={onCompare}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select interviewer" />
        </SelectTrigger>
        <SelectContent>
          {comparableInterviewers.map(i => (
            <SelectItem key={i.id} value={i.id}>
              {i.first_name} {i.last_name} ({i.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
