
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FieldDefinition, FilterCondition, FilterOperator } from "@/types/data-explorer";

interface FilterBuilderProps {
  availableFields: FieldDefinition[];
  filters: FilterCondition[];
  onAddFilter: (filter: FilterCondition) => void;
  onRemoveFilter: (index: number) => void;
}

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "between", label: "Between" },
  { value: "in", label: "In List" }
];

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  availableFields,
  filters,
  onAddFilter,
  onRemoveFilter,
}) => {
  const [selectedField, setSelectedField] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("equals");
  const [filterValue, setFilterValue] = useState<string>("");
  
  const handleAddFilter = () => {
    const field = availableFields.find(f => f.id === selectedField);
    if (!field || !filterValue.trim()) return;
    
    onAddFilter({
      field,
      operator: selectedOperator,
      value: filterValue
    });
    
    // Reset form
    setFilterValue("");
  };

  return (
    <Card>
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Current Filters */}
          {filters.length > 0 && (
            <div className="space-y-1">
              {filters.map((filter, index) => (
                <div key={index} className="flex justify-between items-center p-1.5 bg-purple-50 rounded">
                  <div className="text-sm">
                    {filter.field.label} <span className="text-muted-foreground">{getOperatorLabel(filter.operator)}</span> {filter.value}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onRemoveFilter(index)}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Add New Filter */}
          <div className="grid grid-cols-12 gap-2">
            {/* Field Selector */}
            <div className="col-span-4">
              <Select 
                value={selectedField} 
                onValueChange={setSelectedField}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Operator Selector */}
            <div className="col-span-3">
              <Select 
                value={selectedOperator} 
                onValueChange={(value) => setSelectedOperator(value as FilterOperator)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Value Input */}
            <div className="col-span-4">
              <Input
                className="h-8"
                placeholder="Value"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </div>
            
            {/* Add Button */}
            <div className="col-span-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleAddFilter}
                disabled={!selectedField || !filterValue.trim()}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get a readable label for operators
function getOperatorLabel(operator: FilterOperator): string {
  const op = OPERATORS.find(o => o.value === operator);
  return op ? op.label : operator;
}

export default FilterBuilder;
