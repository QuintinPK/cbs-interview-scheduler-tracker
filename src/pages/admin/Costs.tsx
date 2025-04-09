
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

const Costs = () => {
  const { toast } = useToast();
  const { sessions, interviewers, loading } = useDataFetching();
  const [hourlyRate, setHourlyRate] = useState<number>(25);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calculatedCosts, setCalculatedCosts] = useState<{
    interviewerCosts: { id: string; name: string; hours: number; cost: number }[];
    totalCost: number;
    totalHours: number;
  }>({
    interviewerCosts: [],
    totalCost: 0,
    totalHours: 0
  });

  // Fetch the hourly rate from the database
  useEffect(() => {
    const fetchHourlyRate = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching hourly rate from database");
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'hourly_rate')
          .maybeSingle();

        if (error) {
          console.error("Error fetching hourly rate:", error);
          // Handle errors gracefully
          if (error.code === 'PGRST116') {
            console.log("No hourly rate found, using default");
            setHourlyRate(25);
          } else {
            throw error;
          }
        } else if (data) {
          console.log("Retrieved hourly rate data:", data);
          
          // Handle the value based on its type
          if (data.value !== null) {
            let rateValue;
            
            if (typeof data.value === 'number') {
              rateValue = data.value;
            } else if (typeof data.value === 'string') {
              rateValue = parseFloat(data.value);
            } else if (typeof data.value === 'object') {
              // Extract the value if it's stored as an object
              const valueString = JSON.stringify(data.value);
              console.log("Value as string:", valueString);
              
              // Try to extract a number from the JSON
              try {
                const parsed = JSON.parse(valueString);
                if (typeof parsed === 'number') {
                  rateValue = parsed;
                } else {
                  rateValue = 25; // Default
                }
              } catch {
                rateValue = 25; // Default if parsing fails
              }
            }
              
            if (!isNaN(rateValue)) {
              console.log("Setting hourly rate to:", rateValue);
              setHourlyRate(rateValue);
            } else {
              console.log("Using default hourly rate, couldn't parse:", data.value);
              setHourlyRate(25);
            }
          } else {
            // Default if value is null
            setHourlyRate(25);
          }
        } else {
          // No data found
          console.log("No hourly rate found, using default");
          setHourlyRate(25);
        }
      } catch (error) {
        console.error("Error fetching hourly rate:", error);
        // Don't show error toast for navigation issues
        if (!(error instanceof Error && error.message.includes("fetch"))) {
          toast({
            title: "Error",
            description: "Failed to fetch hourly rate",
            variant: "destructive",
          });
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
        throw new Error(`Failed to update hourly rate: ${error.message}`);
      }

      console.log("Hourly rate updated successfully:", data);
      toast({
        title: "Success",
        description: "Hourly rate updated successfully",
      });
      setIsEditing(false);
      
      // Recalculate costs with new rate
      calculateCosts();
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

  // Calculate costs initially and when hourly rate changes
  useEffect(() => {
    if (!loading && !isLoading) {
      calculateCosts();
    }
  }, [hourlyRate, sessions, interviewers, loading, isLoading]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Costs Calculator</h1>
        </div>

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
                      <Label htmlFor="hourlyRate">Hourly Rate (€)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
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
                    <p className="text-4xl font-bold text-primary">€{calculatedCosts.totalCost.toFixed(2)}</p>
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
                      <TableHead>Cost (€{hourlyRate}/hour)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculatedCosts.interviewerCosts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.hours.toFixed(2)}</TableCell>
                        <TableCell>€{item.cost.toFixed(2)}</TableCell>
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
