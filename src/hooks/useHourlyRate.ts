
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useHourlyRate = () => {
  const { toast } = useToast();
  const [hourlyRate, setHourlyRate] = useState<number>(25);
  const [responseRate, setResponseRate] = useState<number>(5);
  const [nonResponseRate, setNonResponseRate] = useState<number>(2);
  const [showResponseRates, setShowResponseRates] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHourlyRate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching rates from edge function");
      
      const response = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "getRates"
        }
      });

      if (response.error) {
        console.error("Error fetching rates:", response.error);
        setError("Failed to fetch rates from server");
        throw response.error;
      }
      
      const data = response.data;
      console.log("Retrieved rates response:", data);
      
      if (data && data.data) {
        const { hourlyRate: rate, responseRate: respRate, nonResponseRate: nonRespRate, showResponseRates: showRates } = data.data;
        
        if (rate !== undefined && !isNaN(Number(rate))) {
          console.log("Setting hourly rate to:", Number(rate));
          setHourlyRate(Number(rate));
        } else {
          console.log("Using default hourly rate");
          setHourlyRate(25);
        }
        
        if (respRate !== undefined && !isNaN(Number(respRate))) {
          setResponseRate(Number(respRate));
        } else {
          setResponseRate(5);
        }
        
        if (nonRespRate !== undefined && !isNaN(Number(nonRespRate))) {
          setNonResponseRate(Number(nonRespRate));
        } else {
          setNonResponseRate(2);
        }
        
        if (showRates !== undefined) {
          setShowResponseRates(Boolean(showRates));
        } else {
          setShowResponseRates(false);
        }
      } else {
        console.log("No rates returned or invalid format, using defaults");
        setHourlyRate(25);
        setResponseRate(5);
        setNonResponseRate(2);
        setShowResponseRates(false);
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
      // Don't show error toast for navigation issues
      if (!(error instanceof Error && error.message.includes("fetch"))) {
        setError("Failed to fetch rates from server");
      }
      // Use default values
      setHourlyRate(25);
      setResponseRate(5);
      setNonResponseRate(2);
      setShowResponseRates(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHourlyRate();
  }, []);

  return {
    hourlyRate,
    setHourlyRate,
    responseRate,
    setResponseRate,
    nonResponseRate,
    setNonResponseRate,
    showResponseRates,
    setShowResponseRates,
    isLoading,
    error,
    fetchHourlyRate
  };
};
