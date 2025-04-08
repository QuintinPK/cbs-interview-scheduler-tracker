
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Interviewer } from "@/types";

interface InterviewerSelectorProps {
  interviewers: Interviewer[];
  selectedInterviewerCode: string;
  onInterviewerChange: (code: string) => void;
}

export const InterviewerSelector = ({
  interviewers,
  selectedInterviewerCode,
  onInterviewerChange,
}: InterviewerSelectorProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="max-w-md">
        <Label htmlFor="interviewer-select">Select Interviewer</Label>
        <Select
          value={selectedInterviewerCode}
          onValueChange={onInterviewerChange}
        >
          <SelectTrigger id="interviewer-select" className="mt-1">
            <SelectValue placeholder="Select an interviewer" />
          </SelectTrigger>
          <SelectContent>
            {interviewers.map((interviewer) => (
              <SelectItem key={interviewer.id} value={interviewer.code}>
                {interviewer.code} - {interviewer.first_name} {interviewer.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
