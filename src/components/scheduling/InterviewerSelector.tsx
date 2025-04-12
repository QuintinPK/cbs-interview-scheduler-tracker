import React from "react";
import { Interviewer } from "@/types";

export interface InterviewerSelectorProps {
  interviewers: Interviewer[];
  selectedInterviewer: Interviewer | undefined;
  onSelectInterviewer: (interviewer: Interviewer) => void;
  loading: boolean;
}

export const InterviewerSelector: React.FC<InterviewerSelectorProps> = ({
  interviewers,
  selectedInterviewer,
  onSelectInterviewer,
  loading
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Select Interviewer</h3>
      {loading ? (
        <div>Loading interviewers...</div>
      ) : (
        <div className="space-y-2">
          {interviewers.map((interviewer) => (
            <button
              key={interviewer.id}
              className={`w-full text-left p-3 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cbs-light ${
                selectedInterviewer?.id === interviewer.id ? 'bg-cbs-light text-white' : 'bg-white'
              }`}
              onClick={() => onSelectInterviewer(interviewer)}
            >
              {interviewer.code} - {interviewer.first_name} {interviewer.last_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
