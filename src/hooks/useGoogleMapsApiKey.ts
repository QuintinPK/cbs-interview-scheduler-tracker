
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
        
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'google_maps_api_key')
          .single();

        if (error) {
          // If the error is "No rows found", that's okay, we'll just return an empty string
          if (error.code === 'PGRST116') {
            setApiKey("");
            return;
          }
          throw new Error(error.message);
        }

        if (data && data.value) {
          try {
            // Try to parse the value as JSON if it's a string
            const valueObj = typeof data.value === 'string' 
              ? JSON.parse(data.value) 
              : data.value;
              
            // Check if it's an object with an apiKey property
            if (valueObj && typeof valueObj === 'object') {
              if ('apiKey' in valueObj) {
                setApiKey(valueObj.apiKey || "");
              } else if ('key' in valueObj) {
                setApiKey(valueObj.key || "");
              } else {
                console.warn("API key object found but no apiKey or key property:", valueObj);
                setApiKey("");
              }
            } else {
              console.warn("Google Maps API key value is not an object:", valueObj);
              setApiKey("");
            }
          } catch (parseError) {
            console.error("Error parsing Google Maps API key value:", parseError);
            setApiKey("");
          }
        } else {
          // If no API key found, set an empty string
          setApiKey("");
          console.warn("No Google Maps API key found in database");
        }
      } catch (err: any) {
        console.error("Error fetching Google Maps API key:", err);
        setError(err.message || "Failed to fetch Google Maps API key");
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
      
      // First check if the key already exists
      const { data: existingData, error: checkError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'google_maps_api_key')
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(checkError.message);
      }
      
      let result;
      
      if (existingData) {
        // Update existing key
        result = await supabase
          .from('app_settings')
          .update({
            value: { apiKey: newApiKey },
            updated_at: new Date().toISOString()
          })
          .eq('key', 'google_maps_api_key');
      } else {
        // Insert new key
        result = await supabase
          .from('app_settings')
          .insert({
            key: 'google_maps_api_key',
            value: { apiKey: newApiKey }
          });
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      setApiKey(newApiKey);
      
      toast({
        title: "Success",
        description: "Google Maps API key updated successfully",
      });
      
      return true;
    } catch (err: any) {
      console.error("Error updating Google Maps API key:", err);
      setError(err.message || "Failed to update Google Maps API key");
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
