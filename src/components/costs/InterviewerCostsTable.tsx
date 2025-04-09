
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InterviewerCost {
  id: string;
  name: string;
  hours: number;
  cost: number;
}

interface InterviewerCostsTableProps {
  interviewerCosts: InterviewerCost[];
  loading: boolean;
  hourlyRate: number;
}

const InterviewerCostsTable: React.FC<InterviewerCostsTableProps> = ({
  interviewerCosts,
  loading,
  hourlyRate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Costs Per Interviewer</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4 text-muted-foreground">Loading...</p>
        ) : interviewerCosts.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No data available</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interviewer</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Cost (${hourlyRate}/hour)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviewerCosts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.hours.toFixed(2)}</TableCell>
                    <TableCell>${item.cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterviewerCostsTable;
