
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, StarOff, Trash, FileSpreadsheet, ChartBar, ChartLine, ChartPie } from "lucide-react";
import { SavedReport } from "@/types/data-explorer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface SavedReportsPanelProps {
  onSelectReport: (report: SavedReport) => void;
  savedReports: SavedReport[];
  onReportsChange: () => void;
}

const SavedReportsPanel: React.FC<SavedReportsPanelProps> = ({ 
  onSelectReport, 
  savedReports, 
  onReportsChange 
}) => {
  const getIconForReportType = (type: SavedReport["chartType"]) => {
    switch (type) {
      case "bar": return <ChartBar className="h-4 w-4" />;
      case "line": return <ChartLine className="h-4 w-4" />;
      case "pie": return <ChartPie className="h-4 w-4" />;
      case "table": return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  const toggleFavorite = async (reportId: string, favorite: boolean, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering report selection
    
    try {
      const { error } = await supabase
        .from('data_explorer_reports')
        .update({ favorite: !favorite })
        .eq('id', reportId);
        
      if (error) throw error;
      
      toast({
        description: `Report ${favorite ? 'removed from' : 'added to'} favorites`,
      });
      
      // Trigger refresh of reports
      onReportsChange();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive"
      });
    }
  };

  const deleteReport = async (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering report selection
    
    try {
      const { error } = await supabase
        .from('data_explorer_reports')
        .delete()
        .eq('id', reportId);
        
      if (error) throw error;
      
      toast({
        description: "Report deleted successfully",
      });
      
      // Trigger refresh of reports
      onReportsChange();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Saved Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {savedReports.map((report) => (
            <div
              key={report.id}
              className="group p-2 rounded-md hover:bg-gray-100 cursor-pointer flex items-center justify-between"
              onClick={() => onSelectReport(report)}
            >
              <div className="flex items-center space-x-2">
                {getIconForReportType(report.chartType)}
                <div>
                  <div className="font-medium text-sm">{report.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(report.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0"
                  onClick={(e) => toggleFavorite(report.id, report.favorite, e)}
                >
                  {report.favorite ? <Star className="h-3.5 w-3.5 text-yellow-500" /> : <StarOff className="h-3.5 w-3.5" />}
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
          
          {savedReports.length === 0 && (
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
