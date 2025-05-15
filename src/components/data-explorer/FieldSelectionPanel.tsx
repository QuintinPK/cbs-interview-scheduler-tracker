
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus, Trash, Play } from "lucide-react";
import { 
  DataSourceType, 
  FieldDefinition, 
  QueryConfig, 
  FilterCondition 
} from "@/types/data-explorer";
import { getFieldsForDataSource } from "@/utils/data-explorer-utils";
import FilterBuilder from "./FilterBuilder";

interface FieldSelectionPanelProps {
  dataSource: DataSourceType;
  queryConfig: QueryConfig;
  onQueryConfigChange: (config: QueryConfig) => void;
  onRunQuery: () => void;
}

const FieldSelectionPanel: React.FC<FieldSelectionPanelProps> = ({
  dataSource,
  queryConfig,
  onQueryConfigChange,
  onRunQuery,
}) => {
  const availableFields = getFieldsForDataSource(dataSource);
  
  const handleAddField = (field: FieldDefinition, target: keyof QueryConfig) => {
    const updatedConfig = { 
      ...queryConfig,
      [target]: [...queryConfig[target], field]
    };
    onQueryConfigChange(updatedConfig);
  };
  
  const handleRemoveField = (index: number, target: keyof QueryConfig) => {
    const updatedFields = [...queryConfig[target]];
    updatedFields.splice(index, 1);
    
    const updatedConfig = { 
      ...queryConfig,
      [target]: updatedFields
    };
    onQueryConfigChange(updatedConfig);
  };
  
  const handleAddFilter = (filter: FilterCondition) => {
    const updatedConfig = { 
      ...queryConfig,
      filters: [...queryConfig.filters, filter]
    };
    onQueryConfigChange(updatedConfig);
  };
  
  const handleRemoveFilter = (index: number) => {
    const updatedFilters = [...queryConfig.filters];
    updatedFilters.splice(index, 1);
    
    const updatedConfig = { 
      ...queryConfig,
      filters: updatedFilters
    };
    onQueryConfigChange(updatedConfig);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Available Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {availableFields.map((field) => (
                <div key={field.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium">{field.label}</div>
                    <div className="text-xs text-muted-foreground">{field.type}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleAddField(field, 'rows')}
                      title="Add to Rows"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleAddField(field, 'columns')}
                      title="Add to Columns"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleAddField(field, 'values')}
                      title="Add to Values"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <div className="space-y-4">
          {/* Rows Section */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Rows (Group By)</CardTitle>
            </CardHeader>
            <CardContent>
              {queryConfig.rows.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">No rows selected</div>
              ) : (
                <div className="space-y-1">
                  {queryConfig.rows.map((field, index) => (
                    <div key={index} className="flex justify-between items-center p-1.5 bg-blue-50 rounded">
                      <div className="text-sm">{field.label}</div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleRemoveField(index, 'rows')}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Values Section */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Values (Metrics)</CardTitle>
            </CardHeader>
            <CardContent>
              {queryConfig.values.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">No values selected</div>
              ) : (
                <div className="space-y-1">
                  {queryConfig.values.map((field, index) => (
                    <div key={index} className="flex justify-between items-center p-1.5 bg-green-50 rounded">
                      <div className="text-sm">{field.label}</div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleRemoveField(index, 'values')}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Filters Section */}
          <FilterBuilder 
            availableFields={availableFields} 
            filters={queryConfig.filters}
            onAddFilter={handleAddFilter}
            onRemoveFilter={handleRemoveFilter}
          />
          
          <div className="flex justify-end">
            <Button onClick={onRunQuery} className="w-full">
              <Play className="h-4 w-4 mr-2" /> Run Query
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldSelectionPanel;
