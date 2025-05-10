
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useGoogleMapsApiKey = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "google_maps_api_key")
          .single();

        if (error) {
          console.error("Error fetching Google Maps API key:", error);
          setError("Failed to load API key");
          return;
        }

        // Check if data exists and has a value property
        if (data && typeof data.value === 'object' && data.value !== null) {
          // First try apiKey property
          if ('apiKey' in data.value) {
            setApiKey(data.value.apiKey as string);
          } 
          // Then try key property for backward compatibility
          else if ('key' in data.value) {
            setApiKey(data.value.key as string);
          } else {
            console.warn("API key format not recognized in settings");
          }
        } else {
          console.warn("API key not found in settings");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  const updateApiKey = useCallback(async (newApiKey: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if the setting already exists
      const { data: existingData } = await supabase
        .from("app_settings")
        .select("id")
        .eq("key", "google_maps_api_key")
        .maybeSingle();

      if (existingData) {
        // Update existing setting
        const { error: updateError } = await supabase
          .from("app_settings")
          .update({
            value: { apiKey: newApiKey },
            updated_at: new Date().toISOString(),
          })
          .eq("key", "google_maps_api_key");

        if (updateError) {
          throw updateError;
        }
      } else {
        // Insert new setting
        const { error: insertError } = await supabase
          .from("app_settings")
          .insert({
            key: "google_maps_api_key",
            value: { apiKey: newApiKey },
          });

        if (insertError) {
          throw insertError;
        }
      }

      setApiKey(newApiKey);
      return true;
    } catch (err: any) {
      console.error("Error updating API key:", err);
      setError(err.message || "Failed to update API key");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    apiKey,
    loading,
    error,
    updateApiKey,
  };
};
