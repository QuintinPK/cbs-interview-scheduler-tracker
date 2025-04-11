
import React, { useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useHourlyRate } from "@/hooks/useHourlyRate";
import { useCostsCalculator } from "@/hooks/useCostsCalculator";
import HourlyRateCard from "@/components/costs/HourlyRateCard";
import TotalCostsCard from "@/components/costs/TotalCostsCard";
import InterviewerCostsTable from "@/components/costs/InterviewerCostsTable";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";

const Costs = () => {
  const { sessions, interviewers, loading: dataLoading } = useDataFetching();
  const [interviews, setInterviews] = React.useState<Interview[]>([]);
  const [loadingInterviews, setLoadingInterviews] = React.useState(true);
  
  const { 
    hourlyRate, setHourlyRate, 
    responseRate, setResponseRate,
    nonResponseRate, setNonResponseRate,
    showResponseRates, setShowResponseRates,
    isLoading, error, fetchHourlyRate 
  } = useHourlyRate();
  
  const { calculatedCosts, calculateCosts } = useCostsCalculator(
    sessions,
    interviewers,
    interviews,
    hourlyRate,
    responseRate,
    nonResponseRate,
    showResponseRates
  );

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoadingInterviews(true);
        const { data, error } = await supabase
          .from('interviews')
          .select('*');
          
        if (error) throw error;
        
        // Type assertion to handle the result field compatibility
        const typedInterviews = data?.map(interview => ({
          ...interview,
          // Ensure result is one of the valid types or null
          result: interview.result === 'response' || interview.result === 'non-response' 
            ? interview.result 
            : null
        })) as Interview[] || [];
        
        setInterviews(typedInterviews);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoadingInterviews(false);
      }
    };
    
    fetchInterviews();
  }, []);

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
          {/* Hourly and Response Rates Card */}
          <HourlyRateCard
            hourlyRate={hourlyRate}
            responseRate={responseRate}
            nonResponseRate={nonResponseRate}
            showResponseRates={showResponseRates}
            isLoading={isLoading}
            error={error}
            onRateChange={setHourlyRate}
            onResponseRateChange={setResponseRate}
            onNonResponseRateChange={setNonResponseRate}
            onToggleResponseRates={setShowResponseRates}
            recalculateCosts={calculateCosts}
          />

          {/* Total Cost Card */}
          <TotalCostsCard
            totalCost={calculatedCosts.totalCost}
            totalHours={calculatedCosts.totalHours}
            totalResponses={calculatedCosts.totalResponses}
            totalNonResponses={calculatedCosts.totalNonResponses}
            showResponseRates={showResponseRates}
            onRecalculate={calculateCosts}
          />
        </div>

        {/* Costs Per Interviewer */}
        <InterviewerCostsTable
          interviewerCosts={calculatedCosts.interviewerCosts}
          loading={dataLoading || isLoading || loadingInterviews}
          hourlyRate={hourlyRate}
          responseRate={responseRate}
          nonResponseRate={nonResponseRate}
          showResponseRates={showResponseRates}
        />
      </div>
    </AdminLayout>
  );
};

export default Costs;
