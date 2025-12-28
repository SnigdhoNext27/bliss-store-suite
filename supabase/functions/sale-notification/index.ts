import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SaleNotificationRequest {
  productName: string;
  originalPrice: number;
  salePrice: number;
  productSlug: string;
  productImage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Sale notification function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { productName, originalPrice, salePrice, productSlug, productImage }: SaleNotificationRequest = await req.json();
    
    console.log(`Processing sale notification for product: ${productName}`);
    
    // Calculate discount percentage
    const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    
    // Fetch admin notification email from settings
    let adminEmail = '';
    try {
      const { data: emailSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "admin_notification_email")
        .single();
      
      if (emailSetting?.value) {
        adminEmail = emailSetting.value;
        console.log("Admin notification email:", adminEmail);
      }
    } catch (settingsError) {
      console.log("Could not fetch admin email setting:", settingsError);
    }

    // Fetch all active newsletter subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching subscribers:", fetchError);
      throw new Error(`Failed to fetch subscribers: ${fetchError.message}`);
    }

    // Send admin notification about the sale campaign
    if (adminEmail && RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Almans Store <onboarding@resend.dev>",
            to: [adminEmail],
            subject: `📢 Sale Campaign Sent: ${productName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Sale Notification Campaign Sent</h2>
                <p><strong>Product:</strong> ${productName}</p>
                <p><strong>Discount:</strong> ${discountPercent}% OFF</p>
                <p><strong>Original Price:</strong> ৳${originalPrice.toLocaleString()}</p>
                <p><strong>Sale Price:</strong> ৳${salePrice.toLocaleString()}</p>
                <p><strong>Subscribers Notified:</strong> ${subscribers?.length || 0}</p>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an admin notification from Almans Store.</p>
              </div>
            `,
          }),
        });
        console.log("Admin notification sent");
      } catch (adminEmailError) {
        console.error("Failed to send admin notification:", adminEmailError);
      }
    }

    // Create a notification record in the database for in-app notification
    try {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          title: `🔥 Flash Sale: ${discountPercent}% OFF!`,
          message: `${productName} is now on sale! Don't miss out on this amazing deal.`,
          type: "promo",
          link: `/product/${productSlug}`,
          is_global: true,
          user_id: null,
        });

      if (notifError) {
        console.error("Error creating notification:", notifError);
      } else {
        console.log("In-app notification created successfully");
      }
    } catch (notifInsertError) {
      console.error("Failed to insert notification:", notifInsertError);
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No active subscribers found");
      return new Response(
        JSON.stringify({ success: true, message: "No subscribers to notify (in-app notification created)", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${subscribers.length} subscribers to notify`);

    // Helper function to generate unsubscribe token
    async function generateToken(email: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(email + "almans-newsletter-secret");
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
    }

    // Send emails to all subscribers using Resend API
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        // Generate unsubscribe link for this subscriber
        const unsubscribeToken = await generateToken(subscriber.email);
        const unsubscribeUrl = `${supabaseUrl}/functions/v1/newsletter-unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${unsubscribeToken}`;

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Almans Store <onboarding@resend.dev>",
            to: [subscriber.email],
            subject: `🔥 Flash Sale: ${discountPercent}% OFF ${productName}!`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">ALMANS</h1>
                      <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 1px;">PREMIUM FASHION</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <div style="background-color: #ff4444; color: white; display: inline-block; padding: 8px 24px; border-radius: 20px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                        ${discountPercent}% OFF
                      </div>
                      <h2 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 24px;">${productName}</h2>
                      <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px;">Don't miss this amazing deal!</p>
                      <div style="margin: 25px 0;">
                        <span style="color: #999999; text-decoration: line-through; font-size: 18px;">৳${originalPrice.toLocaleString()}</span>
                        <span style="color: #ff4444; font-size: 28px; font-weight: bold; margin-left: 15px;">৳${salePrice.toLocaleString()}</span>
                      </div>
                      <a href="https://almans.lovable.app/product/${productSlug}" 
                         style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-weight: bold; font-size: 16px; letter-spacing: 1px; margin-top: 10px;">
                        SHOP NOW
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
                      <p style="color: #999999; margin: 0; font-size: 12px;">
                        You're receiving this because you subscribed to Almans newsletter.
                      </p>
                      <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 11px;">
                        © 2024 Almans. All rights reserved.
                      </p>
                      <p style="margin: 15px 0 0 0;">
                        <a href="${unsubscribeUrl}" style="color: #999999; font-size: 11px; text-decoration: underline;">
                          Unsubscribe from this newsletter
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to send email");
        }

        const result = await response.json();
        console.log(`Email sent to ${subscriber.email}:`, result);
        return { email: subscriber.email, success: true };
      } catch (emailError: any) {
        console.error(`Failed to send email to ${subscriber.email}:`, emailError);
        return { email: subscriber.email, success: false, error: emailError.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Sale notification complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${successCount} subscribers`,
        successCount,
        failCount,
        total: subscribers.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in sale-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
