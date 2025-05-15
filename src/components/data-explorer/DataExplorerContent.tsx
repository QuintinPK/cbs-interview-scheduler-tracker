
import React, { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import DataSourceSelector from "./DataSourceSelector";
import FieldSelectionPanel from "./FieldSelectionPanel";
import ResultsDisplay from "./ResultsDisplay";
import { DataSourceType, FieldDefinition, QueryConfig, ChartType } from "@/types/data-explorer";
import SavedReportsPanel from "./SavedReportsPanel";
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";

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

  const handleRunQuery = async () => {
    if (!selectedDataSource) return;
    
    setIsLoading(true);
    try {
      // This is where we would build and execute the query based on the configuration
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate some results
      const mockResults = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        interviewer: `Interviewer ${i + 1}`,
        sessions: Math.floor(Math.random() * 100),
        avgDuration: Math.floor(Math.random() * 120) + 30,
        project: `Project ${(i % 3) + 1}`,
        date: new Date(2025, 0, i + 1).toISOString().split('T')[0]
      }));
      
      setResults(mockResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = () => {
    // This would save the current query configuration and chart type
    console.log("Saving report", reportName, queryConfig, selectedChart);
  };
  
  const handleExport = (format: 'csv' | 'excel') => {
    console.log(`Exporting as ${format}`, results);
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
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
        <ResizablePanel defaultSize={15} minSize={10}>
          <SavedReportsPanel />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Main content area */}
        <ResizablePanel defaultSize={85}>
          <ResizablePanelGroup direction="vertical">
            {/* Top section - Data Source Selector and Field Selection */}
            <ResizablePanel defaultSize={40}>
              <div className="p-4 h-full">
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
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Bottom section - Results Display */}
            <ResizablePanel defaultSize={60}>
              <div className="p-4 h-full">
                <ResultsDisplay
                  results={results}
                  isLoading={isLoading}
                  chartType={selectedChart}
                  onChangeChartType={setSelectedChart}
                  queryConfig={queryConfig}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default DataExplorerContent;
