
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDataFetching } from "@/hooks/useDataFetching";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Costs = () => {
  const { toast } = useToast();
  const { sessions, interviewers, loading } = useDataFetching();
  const [hourlyRate, setHourlyRate] = useState<number>(25);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatedCosts, setCalculatedCosts] = useState<{
    interviewerCosts: { id: string; name: string; hours: number; cost: number }[];
    totalCost: number;
    totalHours: number;
  }>({
    interviewerCosts: [],
    totalCost: 0,
    totalHours: 0
  });

  // Fetch the hourly rate from the edge function
  useEffect(() => {
    const fetchHourlyRate = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching hourly rate from edge function");
        
        const { data: response, error } = await supabase.functions.invoke('admin-functions', {
          body: {
            action: "getHourlyRate"
          }
        });

        if (error) {
          console.error("Error fetching hourly rate:", error);
          setError("Failed to fetch hourly rate from server");
          throw error;
        }
        
        console.log("Retrieved hourly rate response:", response);
        
        if (response && response.data && response.data.hourlyRate !== undefined) {
          const rate = Number(response.data.hourlyRate);
          console.log("Parsed rate:", rate);
          
          if (!isNaN(rate)) {
            console.log("Setting hourly rate to:", rate);
            setHourlyRate(rate);
          } else {
            console.log("Using default hourly rate, couldn't parse number:", response.data.hourlyRate);
            setHourlyRate(25);
          }
        } else {
          console.log("No hourly rate returned or invalid format, using default");
          setHourlyRate(25);
        }
      } catch (error) {
        console.error("Error fetching hourly rate:", error);
        // Don't show error toast for navigation issues
        if (!(error instanceof Error && error.message.includes("fetch"))) {
          setError("Failed to fetch hourly rate from server");
        }
        // Use default value
        setHourlyRate(25);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHourlyRate();
  }, [toast]);

  // Calculate costs based on the sessions and hourly rate
  const calculateCosts = () => {
    // Create a map to track hours per interviewer
    const interviewerHours: Map<string, number> = new Map();
    const interviewerNames: Map<string, string> = new Map();

    // Calculate hours for each interviewer
    sessions.forEach((session) => {
      if (!session.is_active && session.end_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        const currentHours = interviewerHours.get(session.interviewer_id) || 0;
        interviewerHours.set(session.interviewer_id, currentHours + durationHours);

        // Store interviewer name
        const interviewer = interviewers.find((i) => i.id === session.interviewer_id);
        if (interviewer) {
          interviewerNames.set(
            session.interviewer_id,
            `${interviewer.first_name} ${interviewer.last_name} (${interviewer.code})`
          );
        }
      }
    });

    // Calculate costs for each interviewer
    const interviewerCosts = Array.from(interviewerHours.entries()).map(([id, hours]) => ({
      id,
      name: interviewerNames.get(id) || "Unknown",
      hours,
      cost: hours * hourlyRate,
    }));

    // Calculate total hours and cost
    const totalHours = interviewerCosts.reduce((sum, item) => sum + item.hours, 0);
    const totalCost = interviewerCosts.reduce((sum, item) => sum + item.cost, 0);

    setCalculatedCosts({
      interviewerCosts,
      totalCost,
      totalHours
    });
  };

  // Update the hourly rate in the database
  const updateHourlyRate = async () => {
    try {
      setIsSaving(true);
      setError(null);
      console.log("Updating hourly rate to:", hourlyRate);
      
      // Call edge function to update hourly rate
      const { data, error } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "updateHourlyRate",
          data: {
            rate: hourlyRate
          }
        }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        setError("Failed to update hourly rate: " + error.message);
        toast({
          title: "Error",
          description: "Failed to update hourly rate: " + error.message,
          variant: "destructive",
        });
        return;
      }

      console.log("Hourly rate update response:", data);
      if (!data?.success) {
        setError("Failed to update hourly rate: Edge Function returned a non-2xx status code");
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
      
      // Recalculate costs with new rate
      calculateCosts();
    } catch (error) {
      console.error("Error updating hourly rate:", error);
      setError(error instanceof Error ? error.message : "Failed to update hourly rate");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate costs initially and when hourly rate changes
  useEffect(() => {
    if (!loading && !isLoading) {
      calculateCosts();
    }
  }, [hourlyRate, sessions, interviewers, loading, isLoading]);

  // Handle hourly rate input changes
  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setHourlyRate(value);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Costs Calculator</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Hourly Rate Card */}
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
                        value={hourlyRate}
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

          {/* Total Cost Card */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Total Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="bg-primary/10 p-6 rounded-lg">
                    <p className="text-lg text-muted-foreground">Total Cost (All Interviewers)</p>
                    <p className="text-4xl font-bold text-primary">${calculatedCosts.totalCost.toFixed(2)}</p>
                  </div>
                  
                  <div className="bg-primary/5 p-6 rounded-lg">
                    <p className="text-lg text-muted-foreground">Total Hours Worked</p>
                    <p className="text-3xl font-bold">{calculatedCosts.totalHours.toFixed(2)} hours</p>
                  </div>
                </div>
                
                <Button 
                  onClick={calculateCosts} 
                  className="w-full"
                  variant="outline"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Recalculate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Costs Per Interviewer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Costs Per Interviewer</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || isLoading ? (
              <p className="text-center py-4 text-muted-foreground">Loading...</p>
            ) : calculatedCosts.interviewerCosts.length === 0 ? (
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
                    {calculatedCosts.interviewerCosts.map((item) => (
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
      </div>
    </AdminLayout>
  );
};

export default Costs;
