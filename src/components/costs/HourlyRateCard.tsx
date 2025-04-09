
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface HourlyRateCardProps {
  hourlyRate: number;
  isLoading: boolean;
  error: string | null;
  onRateChange: (newRate: number) => void;
  recalculateCosts: () => void;
}

const HourlyRateCard: React.FC<HourlyRateCardProps> = ({
  hourlyRate,
  isLoading,
  error,
  onRateChange,
  recalculateCosts
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rateValue, setRateValue] = useState(hourlyRate);

  // Update local state when the prop changes
  React.useEffect(() => {
    setRateValue(hourlyRate);
  }, [hourlyRate]);

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setRateValue(value);
    }
  };

  const updateHourlyRate = async () => {
    try {
      setIsSaving(true);
      console.log("Updating hourly rate to:", rateValue);
      
      // Call edge function to update hourly rate
      const { data, error } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "updateHourlyRate",
          data: {
            rate: rateValue
          }
        }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        toast({
          title: "Error",
          description: "Failed to update hourly rate: " + error.message,
          variant: "destructive",
        });
        return;
      }

      console.log("Hourly rate update response:", data);
      if (!data?.success) {
        toast({
          title: "Error",
          description: "Failed to update hourly rate: Edge Function returned a non-2xx status code",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Hourly rate updated successfully",
      });
      setIsEditing(false);
      
      // Update parent component with new rate and recalculate costs
      onRateChange(rateValue);
      recalculateCosts();
    } catch (error) {
      console.error("Error updating hourly rate:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update hourly rate",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Hourly Rate</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-muted-foreground">Loading hourly rate...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={rateValue}
                  onChange={handleHourlyRateChange}
                  step="0.50"
                  min="0"
                  disabled={!isEditing}
                />
              </div>
              <div>
                {isEditing ? (
                  <Button 
                    onClick={updateHourlyRate} 
                    disabled={isSaving}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Rate"}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="outline"
                    className="w-full"
                  >
                    Edit Rate
                  </Button>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              <p className="font-medium">Note:</p>
              <p>In the future, a bonus or extra amount may be applied based on the interview result type (response or non-response), but this is currently not included in the calculation.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HourlyRateCard;
