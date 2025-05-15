
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, StarOff, Trash, FileSpreadsheet, ChartBar, ChartLine, ChartPie } from "lucide-react";
import { SavedReport } from "@/types/data-explorer";

// Mock data for saved reports
const MOCK_SAVED_REPORTS: SavedReport[] = [
  { 
    id: "1", 
    name: "Interviewer Performance", 
    chartType: "bar", 
    favorite: true,
    createdAt: "2025-05-10",
    updatedAt: "2025-05-10",
    dataSource: "interviewers_sessions",
    queryConfig: {
      rows: [{ id: "interviewer_name", label: "Interviewer Name", type: "text" }],
      columns: [],
      values: [{ id: "sessions_count", label: "Sessions Count", type: "number", aggregate: true }],
      filters: []
    }
  },
  { 
    id: "2", 
    name: "Project Completion Rates", 
    chartType: "line", 
    favorite: false,
    createdAt: "2025-05-09",
    updatedAt: "2025-05-09",
    dataSource: "projects_interviewers",
    queryConfig: {
      rows: [{ id: "project_name", label: "Project Name", type: "text" }],
      columns: [],
      values: [{ id: "response_rate", label: "Response Rate", type: "number" }],
      filters: []
    }
  },
  { 
    id: "3", 
    name: "Island Distribution", 
    chartType: "pie", 
    favorite: true,
    createdAt: "2025-05-08",
    updatedAt: "2025-05-08",
    dataSource: "interviewers_sessions",
    queryConfig: {
      rows: [{ id: "island", label: "Island", type: "text" }],
      columns: [],
      values: [{ id: "interviewers_count", label: "Interviewers Count", type: "number", aggregate: true }],
      filters: []
    }
  },
  { 
    id: "4", 
    name: "Session Details", 
    chartType: "table", 
    favorite: false,
    createdAt: "2025-05-07",
    updatedAt: "2025-05-07",
    dataSource: "sessions_duration",
    queryConfig: {
      rows: [{ id: "interview_date", label: "Interview Date", type: "date" }],
      columns: [],
      values: [{ id: "total_sessions", label: "Total Sessions", type: "number", aggregate: true }],
      filters: []
    }
  },
];

interface SavedReportsPanelProps {
  onSelectReport: (report: SavedReport) => void;
}

const SavedReportsPanel: React.FC<SavedReportsPanelProps> = ({ onSelectReport }) => {
  const getIconForReportType = (type: SavedReport["chartType"]) => {
    switch (type) {
      case "bar": return <ChartBar className="h-4 w-4" />;
      case "line": return <ChartLine className="h-4 w-4" />;
      case "pie": return <ChartPie className="h-4 w-4" />;
      case "table": return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  const toggleFavorite = (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering report selection
    console.log("Toggling favorite for report:", reportId);
  };

  const deleteReport = (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering report selection
    console.log("Deleting report:", reportId);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Saved Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {MOCK_SAVED_REPORTS.map((report) => (
            <div
              key={report.id}
              className="group p-2 rounded-md hover:bg-gray-100 cursor-pointer flex items-center justify-between"
              onClick={() => onSelectReport(report)}
            >
              <div className="flex items-center space-x-2">
                {getIconForReportType(report.chartType)}
                <div>
                  <div className="font-medium text-sm">{report.name}</div>
                  <div className="text-xs text-muted-foreground">{report.updatedAt}</div>
                </div>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0"
                  onClick={(e) => toggleFavorite(report.id, e)}
                >
                  {report.favorite ? <Star className="h-3.5 w-3.5" /> : <StarOff className="h-3.5 w-3.5" />}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0"
                  onClick={(e) => deleteReport(report.id, e)}
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          
          {MOCK_SAVED_REPORTS.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No saved reports yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavedReportsPanel;
