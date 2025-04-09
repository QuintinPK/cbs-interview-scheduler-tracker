
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
        
        // Return the hourly rate, or default if not found
        const hourlyRate = rateData ? Number(rateData.value) : 25;
        console.log("Retrieved hourly rate:", hourlyRate);
        
        result = { 
          success: true,
          hourlyRate: hourlyRate
        };
        break;
        
      case "updatePassword":
        // Update admin password hash
        console.log("Updating password hash");
        console.log("New password hash:", data.passwordHash);
        
        // Check if password hash entry exists
        const { data: existingPasswordData, error: checkPasswordError } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'admin_password_hash')
          .maybeSingle();
          
        if (checkPasswordError) {
          console.error("Error checking for existing password:", checkPasswordError);
          throw checkPasswordError;
        }
        
        // Store hash as a direct string, not as an object
        let updateResult;
        if (existingPasswordData) {
          // Update existing password hash
          updateResult = await supabase
            .from('app_settings')
            .update({
              value: data.passwordHash, // Store as direct string
              updated_at: new Date().toISOString(),
              updated_by: 'admin'
            })
            .eq('key', 'admin_password_hash');
        } else {
          // Insert new password hash
          updateResult = await supabase
            .from('app_settings')
            .insert({
              key: 'admin_password_hash',
              value: data.passwordHash, // Store as direct string
              updated_at: new Date().toISOString(),
              updated_by: 'admin'
            });
        }
        
        if (updateResult.error) {
          console.error("Error updating password:", updateResult.error);
          throw updateResult.error;
        }
        
        // Double-check that the password was updated correctly
        const { data: verifyData, error: verifyError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'admin_password_hash')
          .maybeSingle();
          
        if (verifyError) {
          console.error("Error verifying password update:", verifyError);
        } else {
          console.log("Password verified in database:", verifyData);
        }
        
        console.log("Password updated successfully");
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
