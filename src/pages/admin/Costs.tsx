
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useHourlyRate } from "@/hooks/useHourlyRate";
import { useCostsCalculator } from "@/hooks/useCostsCalculator";
import HourlyRateCard from "@/components/costs/HourlyRateCard";
import TotalCostsCard from "@/components/costs/TotalCostsCard";
import InterviewerCostsTable from "@/components/costs/InterviewerCostsTable";

const Costs = () => {
  const { sessions, interviewers, loading: dataLoading } = useDataFetching();
  const { hourlyRate, setHourlyRate, isLoading, error, fetchHourlyRate } = useHourlyRate();
  const { calculatedCosts, calculateCosts } = useCostsCalculator(
    sessions,
    interviewers,
    hourlyRate
  );

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
          <HourlyRateCard
            hourlyRate={hourlyRate}
            isLoading={isLoading}
            error={error}
            onRateChange={setHourlyRate}
            recalculateCosts={calculateCosts}
          />

          {/* Total Cost Card */}
          <TotalCostsCard
            totalCost={calculatedCosts.totalCost}
            totalHours={calculatedCosts.totalHours}
            onRecalculate={calculateCosts}
          />
        </div>

        {/* Costs Per Interviewer */}
        <InterviewerCostsTable
          interviewerCosts={calculatedCosts.interviewerCosts}
          loading={dataLoading || isLoading}
          hourlyRate={hourlyRate}
        />
      </div>
    </AdminLayout>
  );
};

export default Costs;
