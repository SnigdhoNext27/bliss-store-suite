import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Processing scheduled notifications...");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all scheduled notifications that are due
    const now = new Date().toISOString();
    const { data: scheduledNotifications, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("is_sent", false)
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("Error fetching scheduled notifications:", fetchError);
      throw fetchError;
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log("No scheduled notifications to process");
      return new Response(
        JSON.stringify({ success: true, message: "No scheduled notifications", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${scheduledNotifications.length} scheduled notifications to send`);

    // Mark notifications as sent
    const notificationIds = scheduledNotifications.map(n => n.id);
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_sent: true })
      .in("id", notificationIds);

    if (updateError) {
      console.error("Error updating notifications:", updateError);
      throw updateError;
    }

    console.log(`Successfully processed ${scheduledNotifications.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${scheduledNotifications.length} scheduled notifications`,
        count: scheduledNotifications.length,
        ids: notificationIds
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error processing scheduled notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
