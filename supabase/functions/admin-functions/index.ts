
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

  // Get the request body
  const { action, data } = await req.json();
  
  // Create a Supabase client with the Admin key
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    let result;
    
    // Handle different admin actions
    switch (action) {
      case "updateHourlyRate":
        // Update hourly rate
        result = await supabase
          .from("app_settings")
          .upsert({
            key: "hourly_rate",
            value: data.rate,
            updated_at: new Date().toISOString(),
            updated_by: "admin"
          }, { onConflict: "key" });
        break;
        
      case "updatePassword":
        // Update admin password hash
        result = await supabase
          .from("app_settings")
          .upsert({
            key: "admin_password_hash",
            value: { hash: data.passwordHash },
            updated_at: new Date().toISOString(),
            updated_by: "admin"
          }, { onConflict: "key" });
        break;
        
      default:
        throw new Error("Invalid action");
    }
    
    if (result.error) {
      throw result.error;
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
