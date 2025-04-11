
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useGoogleMapsApiKey() {
  const [apiKey, setApiKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.functions.invoke("admin-functions", {
          body: { action: "getGoogleMapsApiKey" },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data && data.success && data.data && data.data.apiKey) {
          setApiKey(data.data.apiKey);
        } else {
          // If no API key found, set an empty string
          setApiKey("");
          console.warn("No Google Maps API key found in database");
        }
      } catch (err) {
        console.error("Error fetching Google Maps API key:", err);
        setError("Failed to fetch Google Maps API key");
        toast({
          title: "Error",
          description: "Failed to fetch Google Maps API key",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, [toast]);

  const updateApiKey = async (newApiKey: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke("admin-functions", {
        body: { 
          action: "updateGoogleMapsApiKey", 
          data: { apiKey: newApiKey } 
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.success) {
        setApiKey(newApiKey);
        toast({
          title: "Success",
          description: "Google Maps API key updated successfully",
        });
        return true;
      } else {
        throw new Error("Failed to update Google Maps API key");
      }
    } catch (err) {
      console.error("Error updating Google Maps API key:", err);
      setError("Failed to update Google Maps API key");
      toast({
        title: "Error",
        description: "Failed to update Google Maps API key",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { apiKey, loading, error, updateApiKey };
}
