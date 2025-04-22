
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TotalCostsCardProps {
  totalCost: number;
  totalHours: number;
  totalResponses: number;
  totalNonResponses: number;
  showResponseRates: boolean;
  onRecalculate?: () => void;
  showRecalculateButton?: boolean;
}

const TotalCostsCard: React.FC<TotalCostsCardProps> = ({
  totalCost,
  totalHours,
  totalResponses,
  totalNonResponses,
  showResponseRates,
  onRecalculate,
  showRecalculateButton = true
}) => {
  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Total Project Cost</h3>
            <div className="mt-1 text-sm text-gray-500">
              Based on {totalHours.toFixed(2)} hours
              {showResponseRates && `, ${totalResponses} responses, ${totalNonResponses} non-responses`}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            {showRecalculateButton && onRecalculate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRecalculate}
                className="text-xs mt-1"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Recalculate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalCostsCard;
