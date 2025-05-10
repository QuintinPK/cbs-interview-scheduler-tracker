
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // The updated API key to store
    const initialApiKey = "AIzaSyD7QTtsaW2EzYuPdVj6cW11ZeuLespL9cY";
    
    // Check if the API key already exists
    const { data: existingKey, error: checkError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'google_maps_api_key')
      .maybeSingle();
    
    if (checkError) {
      throw checkError;
    }
    
    // Only insert if it doesn't exist
    if (!existingKey) {
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert({
          key: 'google_maps_api_key',
          value: { apiKey: initialApiKey },
          updated_at: new Date(),
          updated_by: 'system'
        });
        
      if (insertError) {
        throw insertError;
      }
      
      console.log("Google Maps API key initialized successfully");
    } else {
      console.log("Google Maps API key already exists, skipping initialization");
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error initializing Google Maps API key:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
