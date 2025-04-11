
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InterviewerCost {
  id: string;
  name: string;
  hours: number;
  responses?: number;
  nonResponses?: number;
  hourlyCost: number;
  responseCost?: number;
  nonResponseCost?: number;
  totalCost: number;
}

interface InterviewerCostsTableProps {
  interviewerCosts: InterviewerCost[];
  loading: boolean;
  hourlyRate: number;
  responseRate?: number;
  nonResponseRate?: number;
  showResponseRates: boolean;
}

const InterviewerCostsTable: React.FC<InterviewerCostsTableProps> = ({
  interviewerCosts,
  loading,
  hourlyRate,
  responseRate = 0,
  nonResponseRate = 0,
  showResponseRates
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
                  {showResponseRates && (
                    <>
                      <TableHead>Responses</TableHead>
                      <TableHead>Non-Responses</TableHead>
                    </>
                  )}
                  <TableHead>Hourly Cost (${hourlyRate}/hour)</TableHead>
                  {showResponseRates && (
                    <>
                      <TableHead>Response Bonus (${responseRate}/resp)</TableHead>
                      <TableHead>Non-Resp Bonus (${nonResponseRate}/non-resp)</TableHead>
                    </>
                  )}
                  <TableHead>Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviewerCosts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.hours.toFixed(2)}</TableCell>
                    {showResponseRates && (
                      <>
                        <TableCell>{item.responses}</TableCell>
                        <TableCell>{item.nonResponses}</TableCell>
                      </>
                    )}
                    <TableCell>${item.hourlyCost.toFixed(2)}</TableCell>
                    {showResponseRates && (
                      <>
                        <TableCell>${item.responseCost?.toFixed(2)}</TableCell>
                        <TableCell>${item.nonResponseCost?.toFixed(2)}</TableCell>
                      </>
                    )}
                    <TableCell className="font-bold">${item.totalCost.toFixed(2)}</TableCell>
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
