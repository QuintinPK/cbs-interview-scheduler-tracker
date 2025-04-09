
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
        
        // First check if the record exists
        const { data: existingData, error: checkError } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'hourly_rate')
          .maybeSingle();
        
        if (checkError) {
          console.error("Error checking for existing rate:", checkError);
          throw checkError;
        }
        
        // If record exists, update it, otherwise insert
        if (existingData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('app_settings')
            .update({ 
              value: numericRate,
              updated_at: new Date().toISOString(),
              updated_by: 'admin'
            })
            .eq('key', 'hourly_rate');
          
          if (updateError) {
            console.error("Error updating hourly rate:", updateError);
            throw updateError;
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('app_settings')
            .insert({
              key: 'hourly_rate',
              value: numericRate,
              updated_at: new Date().toISOString(),
              updated_by: 'admin'
            });
          
          if (insertError) {
            console.error("Error inserting hourly rate:", insertError);
            throw insertError;
          }
        }
        
        console.log("Hourly rate updated successfully");
        result = { success: true };
        break;
        
      case "updatePassword":
        // Update admin password hash
        console.log("Updating password hash");
        
        // Use direct insert/update instead of RPC to ensure service role is used
        result = await supabase
          .from('app_settings')
          .upsert({
            key: 'admin_password_hash',
            value: { hash: data.passwordHash },
            updated_at: new Date().toISOString(),
            updated_by: 'admin'
          }, {
            onConflict: 'key'
          });
        break;
        
      default:
        throw new Error("Invalid action");
    }
    
    if (result.error) {
      console.error("Error in database operation:", result.error);
      throw result.error;
    }
    
    console.log("Operation completed successfully");
    return new Response(JSON.stringify({ success: true }), {
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
