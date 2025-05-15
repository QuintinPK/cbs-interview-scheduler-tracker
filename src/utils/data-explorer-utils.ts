
import { DataSourceType, FieldDefinition } from "@/types/data-explorer";

// This function returns the available fields for a given data source
export const getFieldsForDataSource = (dataSource: DataSourceType): FieldDefinition[] => {
  switch (dataSource) {
    case "interviewers_sessions":
      return [
        { id: "interviewer_id", label: "Interviewer ID", type: "text" },
        { id: "interviewer_name", label: "Interviewer Name", type: "text" },
        { id: "interviewer_code", label: "Interviewer Code", type: "text" },
        { id: "island", label: "Island", type: "text" },
        { id: "session_id", label: "Session ID", type: "text" },
        { id: "session_start_time", label: "Session Start Time", type: "datetime" },
        { id: "session_end_time", label: "Session End Time", type: "datetime" },
        { id: "session_duration", label: "Session Duration (min)", type: "number" },
        { id: "is_active", label: "Is Active", type: "boolean" },
        { id: "project_id", label: "Project ID", type: "text" },
        { id: "project_name", label: "Project Name", type: "text" },
        { id: "sessions_count", label: "Sessions Count", type: "number", aggregate: true },
        { id: "avg_duration", label: "Average Duration", type: "number", aggregate: true },
      ];

    case "projects_interviewers":
      return [
        { id: "project_id", label: "Project ID", type: "text" },
        { id: "project_name", label: "Project Name", type: "text" },
        { id: "start_date", label: "Project Start Date", type: "date" },
        { id: "end_date", label: "Project End Date", type: "date" },
        { id: "response_rate", label: "Response Rate", type: "number" },
        { id: "non_response_rate", label: "Non-Response Rate", type: "number" },
        { id: "interviewer_id", label: "Interviewer ID", type: "text" },
        { id: "interviewer_name", label: "Interviewer Name", type: "text" },
        { id: "interviewer_code", label: "Interviewer Code", type: "text" },
        { id: "island", label: "Island", type: "text" },
        { id: "interviewers_count", label: "Interviewers Count", type: "number", aggregate: true },
        { id: "projects_count", label: "Projects Count", type: "number", aggregate: true },
      ];

    case "sessions_duration":
      return [
        { id: "interview_date", label: "Interview Date", type: "date" },
        { id: "interviewer_id", label: "Interviewer ID", type: "text" },
        { id: "interviewer_name", label: "Interviewer Name", type: "text" },
        { id: "project_id", label: "Project ID", type: "text" },
        { id: "project_name", label: "Project Name", type: "text" },
        { id: "total_sessions", label: "Total Sessions", type: "number", aggregate: true },
        { id: "total_duration", label: "Total Duration (min)", type: "number", aggregate: true },
        { id: "avg_session_duration", label: "Avg Session Duration (min)", type: "number", aggregate: true },
        { id: "max_session_duration", label: "Max Session Duration (min)", type: "number", aggregate: true },
        { id: "min_session_duration", label: "Min Session Duration (min)", type: "number", aggregate: true },
      ];

    case "interviews_results":
      return [
        { id: "interview_id", label: "Interview ID", type: "text" },
        { id: "candidate_name", label: "Candidate Name", type: "text" },
        { id: "result", label: "Result", type: "text" },
        { id: "session_id", label: "Session ID", type: "text" },
        { id: "interviewer_id", label: "Interviewer ID", type: "text" },
        { id: "interviewer_name", label: "Interviewer Name", type: "text" },
        { id: "project_id", label: "Project ID", type: "text" },
        { id: "project_name", label: "Project Name", type: "text" },
        { id: "interview_date", label: "Interview Date", type: "date" },
        { id: "start_time", label: "Start Time", type: "datetime" },
        { id: "end_time", label: "End Time", type: "datetime" },
        { id: "duration", label: "Duration (min)", type: "number" },
        { id: "interviews_count", label: "Interviews Count", type: "number", aggregate: true },
        { id: "success_rate", label: "Success Rate", type: "number", aggregate: true },
      ];

    default:
      return [];
  }
};
