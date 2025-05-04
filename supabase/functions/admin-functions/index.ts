import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

Deno.serve(async (req) => {
  // CORS headers for browser requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { action, data } = requestData;
    console.log(`Processing action: ${action} with data:`, data);

    // Handle different actions based on the request
    let result;

    switch (action) {
      case 'getGoogleMapsApiKey':
        console.log("Fetching Google Maps API key");
        result = await getGoogleMapsApiKey();
        console.log("Returning Google Maps API key");
        break;
        
      // Add other cases as needed
        
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    console.log("Operation completed successfully", result);
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper functions
async function getGoogleMapsApiKey() {
  const { data, error } = await supabaseClient
    .from('config')
    .select('value')
    .eq('key', 'google_maps_api_key')
    .single();

  if (error) {
    console.error("Error fetching Google Maps API key:", error);
    throw new Error("Failed to fetch Google Maps API key");
  }

  return { success: true, apiKey: data.value };
}
