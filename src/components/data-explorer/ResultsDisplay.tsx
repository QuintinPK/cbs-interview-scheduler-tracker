
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChartType, QueryConfig } from "@/types/data-explorer";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, LineChart, PieChart, ResponsiveContainer, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";

interface ResultsDisplayProps {
  results: any[] | null;
  isLoading: boolean;
  chartType: ChartType;
  onChangeChartType: (type: ChartType) => void;
  queryConfig: QueryConfig;
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
];

const CHART_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088fe",
  "#00c49f",
  "#ff7300",
];

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  isLoading,
  chartType,
  onChangeChartType,
  queryConfig,
}) => {
  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Running query...</p>
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Configure and run a query to see results here</p>
        </div>
      </Card>
    );
  }

  const hasEnoughDataForChart = results.length > 0 && queryConfig.values.length > 0;
  const columns = results.length > 0 ? Object.keys(results[0]) : [];
  
  // Determine x-axis field (first row field) and y-axis field (first value field)
  const xAxisField = queryConfig.rows.length > 0 ? queryConfig.rows[0].id : columns[0] || "id";
  const yAxisField = queryConfig.values.length > 0 ? queryConfig.values[0].id : columns[1] || "value";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle>Results</CardTitle>
          <div className="flex items-center space-x-2">
            {CHART_TYPES.map((type) => (
              <Button
                key={type.value}
                size="sm"
                variant={chartType === type.value ? "default" : "outline"}
                onClick={() => onChangeChartType(type.value)}
                disabled={type.value !== "table" && !hasEnoughDataForChart}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pt-4">
        {chartType === "table" ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{formatColumnName(column)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map((column) => (
                      <TableCell key={column}>{row[column]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="h-[400px] w-full">
            {renderChart(chartType, results, xAxisField, yAxisField)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function formatColumnName(column: string): string {
  return column
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function renderChart(type: ChartType, data: any[], xAxisField: string, yAxisField: string) {
  switch (type) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisField} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yAxisField} fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisField} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yAxisField} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={yAxisField}
              nameKey={xAxisField}
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    default:
      return null;
  }
}

export default ResultsDisplay;
