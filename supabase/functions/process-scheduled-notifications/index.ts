import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  send_email: boolean;
  target_segment: string;
  target_criteria: Record<string, any>;
}

interface TargetedUser {
  email: string;
  full_name: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Processing scheduled notifications...");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

    let emailsSent = 0;

    for (const notification of scheduledNotifications as Notification[]) {
      // Mark notification as sent
      await supabase
        .from("notifications")
        .update({ is_sent: true })
        .eq("id", notification.id);

      // Send emails if enabled
      if (notification.send_email && resend) {
        const targetedUsers = await getTargetedUsers(supabase, notification);
        
        console.log(`Sending emails to ${targetedUsers.length} users for notification: ${notification.title}`);

        for (const user of targetedUsers) {
          if (!user.email) continue;

          try {
            await resend.emails.send({
              from: "Almans <notifications@resend.dev>",
              to: [user.email],
              subject: notification.title,
              html: generateEmailHtml(notification, user),
            });
            emailsSent++;
          } catch (emailError) {
            console.error(`Failed to send email to ${user.email}:`, emailError);
          }
        }

        // Update delivered count
        await supabase
          .from("notifications")
          .update({ delivered_count: emailsSent })
          .eq("id", notification.id);
      }
    }

    console.log(`Successfully processed ${scheduledNotifications.length} notifications, sent ${emailsSent} emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${scheduledNotifications.length} scheduled notifications`,
        count: scheduledNotifications.length,
        emailsSent,
        ids: scheduledNotifications.map(n => n.id)
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

async function getTargetedUsers(supabase: any, notification: Notification): Promise<TargetedUser[]> {
  const segment = notification.target_segment || 'all';
  const criteria = notification.target_criteria || {};

  console.log(`Getting users for segment: ${segment}`, criteria);

  switch (segment) {
    case 'newsletter_subscribers': {
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .eq("is_active", true);
      return (data || []).map((s: any) => ({ email: s.email, full_name: null }));
    }

    case 'new_customers': {
      // Users who signed up in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data } = await supabase
        .from("profiles")
        .select("email, full_name")
        .gte("created_at", thirtyDaysAgo.toISOString());
      return data || [];
    }

    case 'high_value': {
      // Users who have placed orders totaling more than threshold
      const minValue = criteria.min_order_value || 5000;
      
      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, total")
        .not("user_id", "is", null);

      if (!orders) return [];

      // Group by user and sum totals
      const userTotals: Record<string, number> = {};
      for (const order of orders) {
        if (order.user_id) {
          userTotals[order.user_id] = (userTotals[order.user_id] || 0) + order.total;
        }
      }

      const highValueUserIds = Object.entries(userTotals)
        .filter(([_, total]) => total >= minValue)
        .map(([userId]) => userId);

      if (highValueUserIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, full_name")
        .in("id", highValueUserIds);

      return profiles || [];
    }

    case 'by_location': {
      const city = criteria.city;
      if (!city) return [];

      // Get users who have addresses in the specified city
      const { data: addresses } = await supabase
        .from("addresses")
        .select("user_id")
        .ilike("city", `%${city}%`);

      if (!addresses || addresses.length === 0) return [];

      const userIds = [...new Set(addresses.map((a: any) => a.user_id))];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, full_name")
        .in("id", userIds);

      return profiles || [];
    }

    case 'all':
    default: {
      // Get all users with email + newsletter subscribers
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, full_name")
        .not("email", "is", null);

      const { data: subscribers } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .eq("is_active", true);

      const allEmails = new Map<string, TargetedUser>();
      
      for (const p of (profiles || [])) {
        if (p.email) allEmails.set(p.email, { email: p.email, full_name: p.full_name });
      }
      for (const s of (subscribers || [])) {
        if (s.email && !allEmails.has(s.email)) {
          allEmails.set(s.email, { email: s.email, full_name: null });
        }
      }

      return Array.from(allEmails.values());
    }
  }
}

function generateEmailHtml(notification: Notification, user: TargetedUser): string {
  const greeting = user.full_name ? `Hi ${user.full_name.split(' ')[0]},` : 'Hi there,';
  const linkHtml = notification.link 
    ? `<p style="margin-top: 20px;"><a href="https://almans.lovable.app${notification.link}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Now</a></p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0;">ALMANS</h1>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <p style="margin-top: 0;">${greeting}</p>
        <h2 style="color: #000; margin-top: 0;">${notification.title}</h2>
        <p>${notification.message}</p>
        ${linkHtml}
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        <p>Almans - Premium Fashion</p>
        <p>You're receiving this because you subscribed to notifications from Almans.</p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
