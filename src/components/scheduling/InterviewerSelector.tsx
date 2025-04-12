
import React from "react";
import { Interviewer } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InterviewerSelectorProps {
  interviewers: Interviewer[];
  selectedInterviewer?: Interviewer;
  selectedInterviewerCode?: string;
  onSelectInterviewer?: (interviewer: Interviewer) => void;
  onInterviewerChange?: (code: string) => void;
  loading?: boolean;
  scheduledHours?: number;
  workedHours?: number;
}

export const InterviewerSelector: React.FC<InterviewerSelectorProps> = ({
  interviewers,
  selectedInterviewer,
  selectedInterviewerCode,
  onSelectInterviewer,
  onInterviewerChange,
  loading = false,
  scheduledHours,
  workedHours,
}) => {
  const handleInterviewerClick = (interviewer: Interviewer) => {
    if (onSelectInterviewer) {
      onSelectInterviewer(interviewer);
    }
    if (onInterviewerChange) {
      onInterviewerChange(interviewer.code);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <h3 className="font-medium mb-4">Interviewers</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-cbs border-t-transparent rounded-full" />
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {interviewers.map((interviewer) => (
                <div
                  key={interviewer.id}
                  className={`p-3 rounded-md cursor-pointer ${
                    selectedInterviewer?.id === interviewer.id ||
                    (selectedInterviewerCode && selectedInterviewerCode === interviewer.code)
                      ? "bg-cbs/10 border-l-4 border-cbs"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => handleInterviewerClick(interviewer)}
                >
                  <div className="font-semibold">{interviewer.code}</div>
                  <div className="text-sm text-muted-foreground">
                    {interviewer.first_name} {interviewer.last_name}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {selectedInterviewer && scheduledHours !== undefined && workedHours !== undefined && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-gray-500">Scheduled</div>
                <div className="text-xl font-bold text-cbs">{scheduledHours}h</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Actual</div>
                <div className="text-xl font-bold text-green-600">{workedHours}h</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Efficiency</div>
                <div className="text-xl font-bold text-indigo-600">
                  {scheduledHours > 0 
                    ? Math.round((workedHours / scheduledHours) * 100) 
                    : 0}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
