
import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DataSourceType } from "@/types/data-explorer";

interface DataSourceSelectorProps {
  selectedDataSource: DataSourceType | null;
  onSelectDataSource: (dataSource: DataSourceType) => void;
}

const DATA_SOURCES: { id: DataSourceType; label: string; description: string }[] = [
  { 
    id: "interviewers_sessions", 
    label: "Interviewers & Sessions", 
    description: "Analyze interviewer performance and session details"
  },
  { 
    id: "projects_interviewers", 
    label: "Projects & Assigned Interviewers", 
    description: "Explore project assignments and interviewer participation"
  },
  { 
    id: "sessions_duration", 
    label: "Session Durations", 
    description: "Track session durations per day per interviewer"
  },
  { 
    id: "interviews_results", 
    label: "Interview Results", 
    description: "Analyze interview outcomes and statistics"
  }
];

const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  selectedDataSource,
  onSelectDataSource,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Data Source</CardTitle>
      </CardHeader>
      <div className="p-6">
        <RadioGroup 
          value={selectedDataSource || undefined} 
          onValueChange={(value) => onSelectDataSource(value as DataSourceType)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DATA_SOURCES.map((source) => (
              <div key={source.id} className="flex items-start space-x-2">
                <RadioGroupItem value={source.id} id={`radio-${source.id}`} />
                <div className="grid gap-1.5">
                  <Label htmlFor={`radio-${source.id}`} className="font-medium">
                    {source.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {source.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    </Card>
  );
};

export default DataSourceSelector;
