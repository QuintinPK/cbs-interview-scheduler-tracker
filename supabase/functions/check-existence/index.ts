
// Supabase Edge Function to check if sessions or interviews exist
// This helps avoid excessive type instantiation on the client side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Create a Supabase client with the Auth context from the request
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the request body
    const { type, uniqueKey } = await req.json();

    if (!type || !uniqueKey) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let response;
    
    if (type === "session") {
      response = await supabase
        .from('sessions')
        .select('id')
        .eq('unique_key', uniqueKey)
        .limit(1);
    } else if (type === "interview") {
      response = await supabase
        .from('interviews')
        .select('id')
        .eq('unique_key', uniqueKey)
        .limit(1);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (response.error) {
      return new Response(
        JSON.stringify({ error: response.error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Return the ID if found, null otherwise
    const id = response.data && response.data.length > 0 ? response.data[0].id : null;

    return new Response(
      JSON.stringify({ id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
