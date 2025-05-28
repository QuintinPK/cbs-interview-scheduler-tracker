
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
import { Card, CardContent } from "@/components/ui/card";

interface InterviewerSelectorProps {
  interviewers: Interviewer[];
  loading?: boolean;
  selectedInterviewerCode: string;
  onInterviewerChange: (code: string) => void;
  scheduledHours?: number;
  workedHours?: number;
  onSelect?: (interviewerId: string) => void;
}

export const InterviewerSelector = ({
  interviewers,
  loading = false,
  selectedInterviewerCode,
  onInterviewerChange,
  scheduledHours = 0,
  workedHours = 0,
  onSelect,
}: InterviewerSelectorProps) => {
  // Calculate efficiency percentage
  const efficiency = scheduledHours > 0 
    ? Math.round((workedHours / scheduledHours) * 100) 
    : 0;

  const handleValueChange = (code: string) => {
    onInterviewerChange(code);
    if (onSelect) {
      const interviewer = interviewers.find(i => i.code === code);
      if (interviewer) {
        onSelect(interviewer.id);
      }
    }
  };

  return (
    <Card className="bg-white">
      <CardContent className="pt-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="interviewer-select">Select Interviewer</Label>
            <Select
              value={selectedInterviewerCode}
              onValueChange={handleValueChange}
              disabled={loading}
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
          
          {selectedInterviewerCode && (
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Scheduled</div>
                <div className="text-2xl font-bold text-cbs">{scheduledHours}h</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Worked</div>
                <div className="text-2xl font-bold text-green-600">{workedHours}h</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Efficiency</div>
                <div className="text-2xl font-bold text-indigo-600">{efficiency}%</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
