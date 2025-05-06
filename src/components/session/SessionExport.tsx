
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Session } from "@/types";
import { exportToCSV } from "@/lib/utils";
import { format } from "date-fns";
import { calculateDuration } from "@/utils/sessionUtils";
import { useToast } from "@/hooks/use-toast";

interface SessionExportProps {
  sessions: Session[];
  getInterviewerCode: (id: string) => string;
  loading: boolean;
}

const SessionExport: React.FC<SessionExportProps> = ({ 
  sessions, 
  getInterviewerCode, 
  loading 
}) => {
  const { toast } = useToast();

  const handleExport = () => {
    const exportData = sessions.map(session => ({
      InterviewerCode: getInterviewerCode(session.interviewer_id),
      StartTime: format(new Date(session.start_time), "dd/MM/yyyy HH:mm"),
      EndTime: session.end_time ? format(new Date(session.end_time), "dd/MM/yyyy HH:mm") : 'Active',
      Duration: session.end_time ? calculateDuration(session.start_time, session.end_time) : 'Ongoing',
      StartLocation: session.start_latitude && session.start_longitude ? 
        `${session.start_latitude.toFixed(4)}, ${session.start_longitude.toFixed(4)}` : 'N/A',
      EndLocation: session.end_latitude && session.end_longitude ? 
        `${session.end_latitude.toFixed(4)}, ${session.end_longitude.toFixed(4)}` : 'N/A',
      Status: session.is_active ? 'Active' : 'Completed'
    }));
    
    exportToCSV(exportData);
    toast({
      title: "Export Started",
      description: "Your sessions data is being downloaded as a CSV file.",
    });
  };

  return (
    <Button
      onClick={handleExport}
      className="bg-cbs hover:bg-cbs-light flex items-center gap-2"
      disabled={loading}
    >
      <Download size={16} />
      Export to CSV
    </Button>
  );
};

export default SessionExport;
