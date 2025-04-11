
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

interface TotalCostsCardProps {
  totalCost: number;
  totalHours: number;
  totalResponses?: number;
  totalNonResponses?: number;
  showResponseRates: boolean;
  onRecalculate: () => void;
}

const TotalCostsCard: React.FC<TotalCostsCardProps> = ({
  totalCost,
  totalHours,
  totalResponses = 0,
  totalNonResponses = 0,
  showResponseRates,
  onRecalculate
}) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Total Costs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="bg-primary/10 p-6 rounded-lg">
              <p className="text-lg text-muted-foreground">Total Cost (All Interviewers)</p>
              <p className="text-4xl font-bold text-primary">${totalCost.toFixed(2)}</p>
            </div>
            
            <div className="bg-primary/5 p-6 rounded-lg">
              <p className="text-lg text-muted-foreground">Total Hours Worked</p>
              <p className="text-3xl font-bold">{totalHours.toFixed(2)} hours</p>
            </div>
            
            {showResponseRates && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-md text-muted-foreground">Total Responses</p>
                  <p className="text-2xl font-bold">{totalResponses}</p>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-md text-muted-foreground">Total Non-Responses</p>
                  <p className="text-2xl font-bold">{totalNonResponses}</p>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={onRecalculate} 
            className="w-full"
            variant="outline"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Recalculate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalCostsCard;
