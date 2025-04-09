
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
    // Get the request body
    const { action, data } = await req.json();
    
    // Create a Supabase client with the Admin key (SERVICE_ROLE_KEY)
    // This bypasses RLS policies
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;
    console.log(`Processing action: ${action} with data:`, data);
    
    // Handle different admin actions
    switch (action) {
      case "updateHourlyRate":
        // Store hourly rate as a numeric value
        const numericRate = Number(data.rate);
        if (isNaN(numericRate)) {
          throw new Error("Invalid rate value");
        }
        
        console.log(`Updating hourly rate to: ${numericRate}`);
        
        try {
          // Call the database function to update hourly rate
          const { data: updateResult, error: updateError } = await supabase
            .rpc('admin_update_hourly_rate', { rate: numericRate });
          
          if (updateError) {
            console.error("Error calling admin_update_hourly_rate function:", updateError);
            throw updateError;
          }
          
          console.log("Hourly rate updated successfully using RPC function:", updateResult);
          result = { success: true };
        } catch (rpcError) {
          console.error("RPC error details:", rpcError);
          
          // Fallback: Direct database update if RPC fails
          console.log("Using fallback method for updating hourly rate");
          const { error: directUpdateError } = await supabase
            .from('app_settings')
            .upsert({
              key: 'hourly_rate',
              value: to_jsonb(numericRate),
              updated_at: new Date(),
              updated_by: 'admin'
            }, { onConflict: 'key' });
            
          if (directUpdateError) {
            console.error("Error with direct update:", directUpdateError);
            throw directUpdateError;
          }
          
          result = { success: true };
        }
        break;
        
      case "getHourlyRate":
        console.log("Fetching current hourly rate");
        
        // Get the current hourly rate
        const { data: rateData, error: rateError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'hourly_rate')
          .maybeSingle();
        
        if (rateError) {
          console.error("Error fetching hourly rate:", rateError);
          throw rateError;
        }
        
        console.log("Raw hourly rate data from database:", rateData);
        
        // Extract and parse the hourly rate value
        let hourlyRate = 25; // Default
        if (rateData && rateData.value) {
          try {
            // Handle different possible formats of the stored value
            if (typeof rateData.value === 'number') {
              hourlyRate = rateData.value;
            } else if (typeof rateData.value === 'string') {
              hourlyRate = parseFloat(rateData.value);
            } else if (typeof rateData.value === 'object') {
              // Try to extract the numeric value from JSONB
              const valueText = JSON.stringify(rateData.value);
              console.log("Value as string:", valueText);
              
              // Try several methods to extract the value
              if (rateData.value.hasOwnProperty('value')) {
                hourlyRate = Number(rateData.value.value);
              } else if (valueText.match(/^\d+(\.\d+)?$/)) {
                hourlyRate = Number(valueText);
              } else {
                // Try to parse as a numeric value directly
                const parsed = Number(rateData.value);
                if (!isNaN(parsed)) {
                  hourlyRate = parsed;
                }
              }
            }
          } catch (error) {
            console.error("Error parsing hourly rate:", error);
          }
        }
        
        if (isNaN(hourlyRate)) {
          console.log("Parsed value is NaN, using default rate");
          hourlyRate = 25;
        }
        
        console.log("Retrieved hourly rate (after parsing):", hourlyRate);
        
        result = { 
          success: true,
          hourlyRate: hourlyRate
        };
        break;
        
      case "updatePassword":
        // Update admin password hash
        console.log("Updating password hash");
        
        // Call the database function to update password
        const { data: passwordResult, error: passwordError } = await supabase
          .rpc('admin_update_password', { password_hash: data.passwordHash });
        
        if (passwordError) {
          console.error("Error calling admin_update_password function:", passwordError);
          throw passwordError;
        }
        
        console.log("Password updated successfully using RPC function");
        result = { success: true };
        break;
        
      default:
        throw new Error("Invalid action");
    }
    
    console.log("Operation completed successfully", result);
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
