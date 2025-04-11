
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
        // Validate input data
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
    return new Response(JSON.stringify(result), {
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
