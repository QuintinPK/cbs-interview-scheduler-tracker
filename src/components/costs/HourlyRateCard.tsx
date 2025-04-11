
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";

interface HourlyRateCardProps {
  hourlyRate: number;
  responseRate: number;
  nonResponseRate: number;
  showResponseRates: boolean;
  isLoading: boolean;
  error: string | null;
  onRateChange: (newRate: number) => void;
  onResponseRateChange: (newRate: number) => void;
  onNonResponseRateChange: (newRate: number) => void;
  onToggleResponseRates: (show: boolean) => void;
  recalculateCosts: () => void;
}

const HourlyRateCard: React.FC<HourlyRateCardProps> = ({
  hourlyRate,
  responseRate,
  nonResponseRate,
  showResponseRates,
  isLoading,
  error,
  onRateChange,
  onResponseRateChange,
  onNonResponseRateChange,
  onToggleResponseRates,
  recalculateCosts
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rateValue, setRateValue] = useState(hourlyRate);
  const [responseRateValue, setResponseRateValue] = useState(responseRate);
  const [nonResponseRateValue, setNonResponseRateValue] = useState(nonResponseRate);
  const [showRatesLocal, setShowRatesLocal] = useState(showResponseRates);

  // Update local state when the props change
  useEffect(() => {
    setRateValue(hourlyRate);
    setResponseRateValue(responseRate);
    setNonResponseRateValue(nonResponseRate);
    setShowRatesLocal(showResponseRates);
  }, [hourlyRate, responseRate, nonResponseRate, showResponseRates]);

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setRateValue(value);
    }
  };

  const handleResponseRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setResponseRateValue(value);
    }
  };

  const handleNonResponseRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setNonResponseRateValue(value);
    }
  };

  const handleToggleResponseRates = (checked: boolean) => {
    setShowRatesLocal(checked);
    onToggleResponseRates(checked);
  };

  const updateRates = async () => {
    try {
      setIsSaving(true);
      console.log("Updating rates:", { 
        hourlyRate: rateValue, 
        responseRate: responseRateValue, 
        nonResponseRate: nonResponseRateValue,
        showResponseRates: showRatesLocal
      });
      
      // Call edge function to update rates
      const { data, error } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "updateRates",
          data: {
            hourlyRate: rateValue,
            responseRate: responseRateValue,
            nonResponseRate: nonResponseRateValue,
            showResponseRates: showRatesLocal
          }
        }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        toast({
          title: "Error",
          description: "Failed to update rates: " + error.message,
          variant: "destructive",
        });
        return;
      }

      console.log("Rates update response:", data);
      if (!data?.success) {
        toast({
          title: "Error",
          description: "Failed to update rates: Edge Function returned a non-2xx status code",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Rates updated successfully",
      });
      setIsEditing(false);
      
      // Update parent component with new rates and recalculate costs
      onRateChange(rateValue);
      onResponseRateChange(responseRateValue);
      onNonResponseRateChange(nonResponseRateValue);
      recalculateCosts();
    } catch (error) {
      console.error("Error updating rates:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update rates",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Payment Rates</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-muted-foreground">Loading rates...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="hourlyRate" className="text-base">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={rateValue}
                  onChange={handleHourlyRateChange}
                  step="0.50"
                  min="0"
                  disabled={!isEditing}
                  className="max-w-[120px]"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="showResponseRates"
                  checked={showRatesLocal}
                  onCheckedChange={handleToggleResponseRates}
                  disabled={!isEditing}
                />
                <Label htmlFor="showResponseRates">Include Response/Non-Response Rates</Label>
              </div>
              
              {showRatesLocal && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20 mt-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="responseRate" className="text-base">Response Rate ($)</Label>
                    <Input
                      id="responseRate"
                      type="number"
                      value={responseRateValue}
                      onChange={handleResponseRateChange}
                      step="0.50"
                      min="0"
                      disabled={!isEditing}
                      className="max-w-[120px]"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="nonResponseRate" className="text-base">Non-Response Rate ($)</Label>
                    <Input
                      id="nonResponseRate"
                      type="number"
                      value={nonResponseRateValue}
                      onChange={handleNonResponseRateChange}
                      step="0.50"
                      min="0"
                      disabled={!isEditing}
                      className="max-w-[120px]"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-2">
              {isEditing ? (
                <Button 
                  onClick={updateRates} 
                  disabled={isSaving}
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Rates"}
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  variant="outline"
                  className="w-full"
                >
                  Edit Rates
                </Button>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mt-4">
              <p className="font-medium">Note:</p>
              <p>When response rates are enabled, interviewers will receive the hourly rate plus an additional amount for each response or non-response recorded.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HourlyRateCard;
