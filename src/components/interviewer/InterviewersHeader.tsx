
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import InterviewerCsvImport from "./InterviewerCsvImport";
import { CsvInterviewer } from "@/utils/csvUtils";

interface InterviewersHeaderProps {
  onAddNew: () => void;
  onImport: (interviewers: CsvInterviewer[]) => Promise<void>;
  loading: boolean;
}

const InterviewersHeader: React.FC<InterviewersHeaderProps> = ({
  onAddNew,
  onImport,
  loading
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cbs to-cbs-light bg-clip-text text-transparent">
          Interviewer Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your interview team and their assignments
        </p>
      </div>
      
      <div className="flex gap-2">
        <InterviewerCsvImport onImport={onImport} />
        <Button
          onClick={onAddNew}
          className="bg-cbs hover:bg-cbs-light flex items-center gap-2 transition-all shadow-sm hover:shadow"
          disabled={loading}
        >
          <PlusCircle size={16} />
          Add New Interviewer
        </Button>
      </div>
    </div>
  );
};

export default InterviewersHeader;
