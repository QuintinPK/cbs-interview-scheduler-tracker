
// Available data sources in the application
export type DataSourceType = 
  | "interviewers_sessions" 
  | "projects_interviewers" 
  | "sessions_duration" 
  | "interviews_results";

// Available chart types for visualization
export type ChartType = "table" | "bar" | "line" | "pie";

// Definition of a field in a data source
export interface FieldDefinition {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "datetime" | "boolean";
  aggregate?: boolean; // Whether this field is an aggregation (like COUNT, SUM, etc.)
}

// Filter operators for conditions
export type FilterOperator = 
  | "equals" 
  | "not_equals" 
  | "contains" 
  | "greater_than" 
  | "less_than" 
  | "between" 
  | "in";

// Filter condition for query
export interface FilterCondition {
  field: FieldDefinition;
  operator: FilterOperator;
  value: string; // Value can be parsed based on field type
}

// Query configuration that defines how data should be displayed
export interface QueryConfig {
  rows: FieldDefinition[];
  columns: FieldDefinition[];
  filters: FilterCondition[];
  values: FieldDefinition[];
}

// Definition of a saved report
export interface SavedReport {
  id: string;
  name: string;
  dataSource: DataSourceType;
  queryConfig: QueryConfig;
  chartType: ChartType;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  favorite: boolean;
}
