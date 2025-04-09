
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useHourlyRate = () => {
  const { toast } = useToast();
  const [hourlyRate, setHourlyRate] = useState<number>(25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchHourlyRate();
  }, []);

  return {
    hourlyRate,
    setHourlyRate,
    isLoading,
    error,
    fetchHourlyRate
  };
};
