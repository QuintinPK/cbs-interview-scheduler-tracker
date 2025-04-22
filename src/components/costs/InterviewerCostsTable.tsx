
import React from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface InterviewerCost {
  id: string;
  name: string;
  hours: number;
  responses: number;
  nonResponses: number;
  hourlyCost: number;
  responseCost: number;
  nonResponseCost: number;
  totalCost: number;
}

interface InterviewerCostsTableProps {
  interviewerCosts: InterviewerCost[];
  loading: boolean;
  hourlyRate: number;
  responseRate: number;
  nonResponseRate: number;
  showResponseRates: boolean;
  onInterviewerClick?: (interviewerId: string) => void;
}

const InterviewerCostsTable: React.FC<InterviewerCostsTableProps> = ({
  interviewerCosts,
  loading,
  hourlyRate,
  responseRate,
  nonResponseRate,
  showResponseRates,
  onInterviewerClick
}) => {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading interviewer costs...</div>;
  }

  if (interviewerCosts.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <h3 className="font-medium text-lg mb-3">Interviewer Costs</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Interviewer</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            {showResponseRates && (
              <>
                <TableHead className="text-right">Responses</TableHead>
                <TableHead className="text-right">Non-Responses</TableHead>
              </>
            )}
            <TableHead className="text-right">Hourly Cost (${hourlyRate}/h)</TableHead>
            {showResponseRates && (
              <>
                <TableHead className="text-right">Response Bonus (${responseRate})</TableHead>
                <TableHead className="text-right">Non-Response Bonus (${nonResponseRate})</TableHead>
              </>
            )}
            <TableHead className="text-right">Total Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interviewerCosts.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell>
                {onInterviewerClick ? (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal text-left"
                    onClick={() => onInterviewerClick(cost.id)}
                  >
                    {cost.name}
                  </Button>
                ) : (
                  cost.name
                )}
              </TableCell>
              <TableCell className="text-right">{cost.hours.toFixed(2)}</TableCell>
              {showResponseRates && (
                <>
                  <TableCell className="text-right">{cost.responses}</TableCell>
                  <TableCell className="text-right">{cost.nonResponses}</TableCell>
                </>
              )}
              <TableCell className="text-right">${cost.hourlyCost.toFixed(2)}</TableCell>
              {showResponseRates && (
                <>
                  <TableCell className="text-right">${cost.responseCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${cost.nonResponseCost.toFixed(2)}</TableCell>
                </>
              )}
              <TableCell className="font-medium text-right">${cost.totalCost.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InterviewerCostsTable;
