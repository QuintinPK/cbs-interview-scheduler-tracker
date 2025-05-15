
import React, { useState, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import DataSourceSelector from "./DataSourceSelector";
import FieldSelectionPanel from "./FieldSelectionPanel";
import ResultsDisplay from "./ResultsDisplay";
import { DataSourceType, FieldDefinition, QueryConfig, ChartType, SavedReport, SavedReportDB, convertDBReportToReport } from "@/types/data-explorer";
import SavedReportsPanel from "./SavedReportsPanel";
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { getDataSourceQuery } from "@/utils/data-explorer-utils";
import * as XLSX from 'xlsx';
import { Json } from "@/integrations/supabase/types";

// Define a type to match the Supabase database structure
interface SupabaseSavedReportDB {
  id: string;
  name: string;
  data_source: string;
  query_config: Json;
  chart_type: string;
  created_at?: string;
  updated_at?: string;
  favorite?: boolean;
}

const DataExplorerContent = () => {
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceType | null>(null);
  const [queryConfig, setQueryConfig] = useState<QueryConfig>({
    rows: [],
    columns: [],
    filters: [],
    values: [],
  });
  const [results, setResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartType>("table");
  const [reportName, setReportName] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // Fetch saved reports on component mount
  useEffect(() => {
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    try {
      const { data, error } = await supabase
        .from('data_explorer_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Convert DB format to component format, ensuring proper typing
        const reports = data.map((item: SupabaseSavedReportDB) => 
          convertDBReportToReport({
            id: item.id,
            name: item.name,
            data_source: item.data_source as DataSourceType,
            query_config: item.query_config as unknown as QueryConfig,
            chart_type: item.chart_type as ChartType,
            created_at: item.created_at,
            updated_at: item.updated_at,
            favorite: item.favorite
          })
        );
        setSavedReports(reports);
      }
    } catch (error) {
      console.error("Error fetching saved reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch saved reports",
        variant: "destructive"
      });
    }
  };

  const handleRunQuery = async () => {
    if (!selectedDataSource) return;
    
    setIsLoading(true);
    try {
      // Get the appropriate query for the selected data source
      const query = getDataSourceQuery(selectedDataSource, queryConfig);
      
      // Execute the query with the specified function name
      const functionName = query.function as "get_interviewers_sessions_data" | 
                                           "get_projects_interviewers_data" | 
                                           "get_sessions_duration_data" | 
                                           "get_interviews_results_data";
      
      const { data, error } = await supabase.rpc(functionName, query.params);
      
      if (error) throw error;
      
      // Parse JSON result
      const parsedData = Array.isArray(data) ? data : [];
      setResults(parsedData);
    } catch (error) {
      console.error("Error running query:", error);
      toast({
        title: "Query Error",
        description: "Failed to run the query. Please check your configuration.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportName || !selectedDataSource) {
      toast({
        title: "Validation Error",
        description: "Please enter a report name and select a data source",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Convert QueryConfig to Json by casting through the JSON stringify/parse cycle
      // This ensures proper serialization for database storage
      const reportData = {
        name: reportName,
        data_source: selectedDataSource,
        query_config: JSON.parse(JSON.stringify(queryConfig)) as Json,
        chart_type: selectedChart,
        favorite: false
      };
      
      const { data, error } = await supabase
        .from('data_explorer_reports')
        .insert(reportData)
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Report saved successfully",
      });
      
      // Refresh the saved reports list
      fetchSavedReports();
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Error",
        description: "Failed to save the report",
        variant: "destructive"
      });
    }
  };
  
  const handleExport = (format: 'csv' | 'excel') => {
    if (!results || results.length === 0) {
      toast({
        title: "Export Error",
        description: "No data to export",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const filename = `${reportName || 'export'}_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        // Convert to CSV
        const headers = Object.keys(results[0]).join(',');
        const rows = results.map(row => 
          Object.values(row).map(value => 
            value === null ? '' : 
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : 
            String(value)
          ).join(',')
        ).join('\n');
        const csv = `${headers}\n${rows}`;
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'excel') {
        // Create a workbook with a worksheet containing the data
        const worksheet = XLSX.utils.json_to_sheet(results);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        
        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      }
      
      toast({
        title: "Success",
        description: `Data exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      toast({
        title: "Export Error",
        description: `Failed to export as ${format}`,
        variant: "destructive"
      });
    }
  };
  
  const handleReportSelect = (report: SavedReport) => {
    setSelectedReport(report);
    setSelectedDataSource(report.dataSource);
    setQueryConfig(report.queryConfig);
    setSelectedChart(report.chartType);
    setReportName(report.name);
    
    // After loading the saved report, run the query
    setTimeout(() => {
      handleRunQuery();
    }, 100);
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Report name"
            className="px-3 py-1 border rounded-md"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
          />
          <Button onClick={handleSaveReport} disabled={!reportName || !results}>
            <Save className="h-4 w-4 mr-2" /> Save Report
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('csv')} 
            disabled={!results}
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('excel')} 
            disabled={!results}
          >
            <Download className="h-4 w-4 mr-2" /> Export Excel
          </Button>
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
        {/* Left sidebar for saved reports */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <SavedReportsPanel 
            onSelectReport={handleReportSelect} 
            savedReports={savedReports}
            onReportsChange={fetchSavedReports}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Main content area */}
        <ResizablePanel defaultSize={80}>
          <ResizablePanelGroup direction="vertical">
            {/* Top section - Data Source Selector and Field Selection */}
            <ResizablePanel defaultSize={45} minSize={30} maxSize={70}>
              <ScrollArea className="h-full">
                <div className="p-4">
                  <DataSourceSelector 
                    selectedDataSource={selectedDataSource}
                    onSelectDataSource={setSelectedDataSource}
                  />
                  
                  {selectedDataSource && (
                    <FieldSelectionPanel
                      dataSource={selectedDataSource}
                      queryConfig={queryConfig}
                      onQueryConfigChange={setQueryConfig}
                      onRunQuery={handleRunQuery}
                    />
                  )}
                </div>
              </ScrollArea>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Bottom section - Results Display */}
            <ResizablePanel defaultSize={55} minSize={30}>
              <ScrollArea className="h-full">
                <div className="p-4">
                  <ResultsDisplay
                    results={results}
                    isLoading={isLoading}
                    chartType={selectedChart}
                    onChangeChartType={setSelectedChart}
                    queryConfig={queryConfig}
                  />
                </div>
              </ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default DataExplorerContent;
