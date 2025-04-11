
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
      case "updateRates":
        // Store all rates as a JSONB object
        const { hourlyRate, responseRate, nonResponseRate, showResponseRates } = data;
        
        if (
          hourlyRate === undefined || 
          responseRate === undefined || 
          nonResponseRate === undefined || 
          showResponseRates === undefined
        ) {
          throw new Error("Missing required rate values");
        }
        
        const numericHourlyRate = Number(hourlyRate);
        const numericResponseRate = Number(responseRate);
        const numericNonResponseRate = Number(nonResponseRate);
        
        if (
          isNaN(numericHourlyRate) || 
          isNaN(numericResponseRate) || 
          isNaN(numericNonResponseRate)
        ) {
          throw new Error("Invalid rate values");
        }
        
        console.log(`Updating rates: hourly=${numericHourlyRate}, response=${numericResponseRate}, non-response=${numericNonResponseRate}, showResponseRates=${showResponseRates}`);
        
        // Store all rates in a single app_settings record
        const { error: updateError } = await supabase
          .from('app_settings')
          .upsert({
            key: 'rates',
            value: {
              hourlyRate: numericHourlyRate,
              responseRate: numericResponseRate,
              nonResponseRate: numericNonResponseRate,
              showResponseRates: showResponseRates
            },
            updated_at: new Date(),
            updated_by: 'admin'
          }, { onConflict: 'key' });
          
        if (updateError) {
          console.error("Error updating rates:", updateError);
          throw updateError;
        }
        
        console.log("Rates updated successfully");
        result = { success: true };
        break;
        
      case "getRates":
        console.log("Fetching current rates");
        
        // Get the current rates
        const { data: ratesData, error: ratesError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'rates')
          .maybeSingle();
        
        if (ratesError) {
          console.error("Error fetching rates:", ratesError);
          throw ratesError;
        }
        
        console.log("Raw rates data from database:", ratesData);
        
        // Extract rate values or use defaults
        let rates = {
          hourlyRate: 25,
          responseRate: 5,
          nonResponseRate: 2,
          showResponseRates: false
        };
        
        if (ratesData && ratesData.value) {
          try {
            if (typeof ratesData.value === 'object') {
              // Extract values from JSONB object
              rates = {
                hourlyRate: typeof ratesData.value.hourlyRate === 'number' ? ratesData.value.hourlyRate : 25,
                responseRate: typeof ratesData.value.responseRate === 'number' ? ratesData.value.responseRate : 5,
                nonResponseRate: typeof ratesData.value.nonResponseRate === 'number' ? ratesData.value.nonResponseRate : 2,
                showResponseRates: !!ratesData.value.showResponseRates
              };
            }
          } catch (error) {
            console.error("Error parsing rates:", error);
          }
        } else {
          // If no rates exist yet, create default rates
          console.log("No rates found in database, creating defaults");
          const { error: createError } = await supabase
            .from('app_settings')
            .upsert({
              key: 'rates',
              value: rates,
              updated_at: new Date(),
              updated_by: 'admin'
            }, { onConflict: 'key' });
            
          if (createError) {
            console.error("Error creating default rates:", createError);
          }
        }
        
        console.log("Returning rates:", rates);
        result = { success: true, data: rates };
        break;
        
      case "updateHourlyRate":
        // Store hourly rate as a numeric value
        const numericRate = Number(data.rate);
        if (isNaN(numericRate)) {
          throw new Error("Invalid rate value");
        }
        
        console.log(`Updating hourly rate to: ${numericRate}`);
        
        try {
          // Call the database function to update hourly rate
          const { data: updateResult, error: updateHourlyRateError } = await supabase
            .rpc('admin_update_hourly_rate', { rate: numericRate });
          
          if (updateHourlyRateError) {
            console.error("Error calling admin_update_hourly_rate function:", updateHourlyRateError);
            throw updateHourlyRateError;
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
              value: numericRate,
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
        
        // First try to get the rate from the combined rates object
        const { data: combinedRatesData, error: combinedRatesError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'rates')
          .maybeSingle();
          
        if (!combinedRatesError && combinedRatesData && combinedRatesData.value && 
            typeof combinedRatesData.value === 'object' && 
            typeof combinedRatesData.value.hourlyRate === 'number') {
          console.log("Found hourly rate in combined rates:", combinedRatesData.value.hourlyRate);
          result = { 
            success: true,
            hourlyRate: combinedRatesData.value.hourlyRate
          };
          break;
        }
        
        // Fall back to legacy hourly_rate if needed
        console.log("Falling back to legacy hourly_rate");
        const { data: rateData, error: rateError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'hourly_rate')
          .maybeSingle();
        
        if (rateError) {
          console.error("Error fetching hourly rate:", rateError);
          // Don't throw error, just use default
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
        
      case "updateProjectTitle":
        // Update project title
        console.log("Updating project title to:", data.title);
        
        const { error: titleError } = await supabase
          .from('app_settings')
          .upsert({
            key: 'project_title',
            value: { title: data.title },
            updated_at: new Date(),
            updated_by: 'admin'
          }, { onConflict: 'key' });
          
        if (titleError) {
          console.error("Error updating project title:", titleError);
          throw titleError;
        }
        
        console.log("Project title updated successfully");
        result = { success: true };
        break;
        
      case "deleteAllSessionData":
        // Delete all sessions and interviews
        console.log("Deleting all session and interview data");
        
        // First delete all interviews because they reference sessions
        const { error: interviewsError } = await supabase
          .from('interviews')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all entries
        
        if (interviewsError) {
          console.error("Error deleting interviews:", interviewsError);
          throw interviewsError;
        }
        
        // Then delete all sessions
        const { error: sessionsError } = await supabase
          .from('sessions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all entries
        
        if (sessionsError) {
          console.error("Error deleting sessions:", sessionsError);
          throw sessionsError;
        }
        
        console.log("All session and interview data deleted successfully");
        result = { success: true };
        break;
        
      case "deleteAllInterviewerData":
        // Delete all interviewer data
        console.log("Deleting all interviewer data");
        
        // First delete all sessions and interviews because they reference interviewers
        // Delete all interviews first
        const { error: interviewsDeleteError } = await supabase
          .from('interviews')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all entries
        
        if (interviewsDeleteError) {
          console.error("Error deleting interviews:", interviewsDeleteError);
          throw interviewsDeleteError;
        }
        
        // Delete all sessions
        const { error: sessionsDeleteError } = await supabase
          .from('sessions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all entries
        
        if (sessionsDeleteError) {
          console.error("Error deleting sessions:", sessionsDeleteError);
          throw sessionsDeleteError;
        }
        
        // Delete all schedules
        const { error: schedulesDeleteError } = await supabase
          .from('schedules')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all entries
        
        if (schedulesDeleteError) {
          console.error("Error deleting schedules:", schedulesDeleteError);
          throw schedulesDeleteError;
        }
        
        // Finally delete all interviewers
        const { error: interviewersDeleteError } = await supabase
          .from('interviewers')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all entries
        
        if (interviewersDeleteError) {
          console.error("Error deleting interviewers:", interviewersDeleteError);
          throw interviewersDeleteError;
        }
        
        console.log("All interviewer data deleted successfully");
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
