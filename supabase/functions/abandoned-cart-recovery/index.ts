import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting abandoned cart recovery process...");

    // Get abandoned carts that haven't been reminded recently (at least 1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error: cartsError } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("recovered", false)
      .lt("reminder_count", 3)
      .lt("updated_at", oneHourAgo)
      .or(`last_reminder_at.is.null,last_reminder_at.lt.${oneDayAgo}`)
      .limit(50);

    if (cartsError) {
      console.error("Error fetching abandoned carts:", cartsError);
      throw cartsError;
    }

    console.log(`Found ${abandonedCarts?.length || 0} abandoned carts to process`);

    let emailsSent = 0;
    let errors = 0;

    for (const cart of abandonedCarts || []) {
      try {
        let email: string | null = null;
        
        if (cart.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", cart.user_id)
            .maybeSingle();
          
          email = profile?.email;
        }

        if (!email) {
          console.log(`No email found for cart ${cart.id}, skipping...`);
          continue;
        }

        const cartData = cart.cart_data as { items: Array<{ name: string; price: number; quantity: number; image?: string }> };
        const items = cartData?.items || [];

        if (items.length === 0) {
          console.log(`Cart ${cart.id} is empty, skipping...`);
          continue;
        }

        const itemsHtml = items.map(item => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">` : ""}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <strong>${item.name}</strong><br>
              <span style="color: #666;">Qty: ${item.quantity}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
              ৳${(item.price * item.quantity).toFixed(0)}
            </td>
          </tr>
        `).join("");

        const reminderNumber = (cart.reminder_count || 0) + 1;
        const subjects = [
          "You left something behind! 🛒",
          "Your cart misses you! Complete your order",
          "Last chance! Your cart is waiting"
        ];

        if (resendKey) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #000; margin: 0;">ALMANS</h1>
                <p style="color: #666; margin-top: 5px;">Premium Fashion Essentials</p>
              </div>
              
              <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                <h2 style="margin-top: 0; color: #000;">You left something in your cart!</h2>
                <p style="color: #666;">
                  Don't let these amazing items slip away. Complete your purchase and treat yourself to something special.
                </p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th style="padding: 12px; text-align: left; width: 80px;">Item</th>
                    <th style="padding: 12px; text-align: left;">Details</th>
                    <th style="padding: 12px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px; font-weight: bold;">Total</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">
                      ৳${cart.total_value.toFixed(0)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style="text-align: center; margin-bottom: 30px;">
                <a href="https://almans.com/checkout" 
                   style="display: inline-block; background: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Complete Your Purchase
                </a>
              </div>

              ${reminderNumber >= 2 ? `
              <div style="background: #fff3cd; border-radius: 8px; padding: 16px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0; color: #856404;">
                  ⏰ Items in your cart may sell out soon. Don't miss out!
                </p>
              </div>
              ` : ""}

              <div style="text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
                <p>
                  If you no longer wish to receive these emails, 
                  <a href="https://almans.com/unsubscribe" style="color: #666;">unsubscribe here</a>.
                </p>
                <p>© ${new Date().getFullYear()} Almans. All rights reserved.</p>
              </div>
            </body>
            </html>
          `;

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Almans <orders@almans.com>",
              to: email,
              subject: subjects[reminderNumber - 1] || subjects[0],
              html: emailHtml,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error(`Failed to send email for cart ${cart.id}:`, errorText);
            errors++;
            continue;
          }

          console.log(`Email sent for cart ${cart.id} to ${email}`);
          emailsSent++;
        }

        // Update cart with reminder info
        await supabase
          .from("abandoned_carts")
          .update({
            reminder_sent: true,
            reminder_count: reminderNumber,
            last_reminder_at: new Date().toISOString(),
          })
          .eq("id", cart.id);

        // Create in-app notification if user exists
        if (cart.user_id) {
          await supabase.from("notifications").insert({
            user_id: cart.user_id,
            title: "Complete Your Order 🛒",
            message: `You have ${items.length} item(s) waiting in your cart worth ৳${cart.total_value.toFixed(0)}`,
            type: "info",
            link: "/checkout",
            is_global: false,
          });
        }

      } catch (cartError) {
        console.error(`Error processing cart ${cart.id}:`, cartError);
        errors++;
      }
    }

    console.log(`Abandoned cart recovery complete. Emails sent: ${emailsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: abandonedCarts?.length || 0,
        emailsSent,
        errors 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in abandoned cart recovery:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
