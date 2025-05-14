
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Interviewer } from "@/types";

interface InterviewerHeaderProps {
  interviewer: Interviewer | null;
  loading: boolean;
}

export const InterviewerHeader: React.FC<InterviewerHeaderProps> = ({
  interviewer,
  loading,
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <Button
          variant="ghost"
          className="mb-2 -ml-4 text-gray-600 hover:text-gray-900"
          onClick={() => navigate("/admin/interviewers")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Interviewers
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          {loading ? "Loading..." : interviewer ? `${interviewer.first_name} ${interviewer.last_name}'s Dashboard` : "Interviewer Not Found"}
        </h1>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline"
          onClick={() => interviewer && navigate(`/admin/interactive-scheduling?interviewer=${interviewer.code}`)}
          disabled={loading || !interviewer}
          className="bg-white border-gray-200 hover:bg-gray-100"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </div>
    </div>
  );
};
