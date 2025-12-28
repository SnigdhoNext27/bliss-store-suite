import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriggerConfig {
  id: string;
  trigger_type: string;
  title_template: string;
  message_template: string;
  delay_minutes: number;
  send_email: boolean;
  send_push: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Processing automated notification triggers...");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Get active trigger configurations
    const { data: triggers } = await supabase
      .from("notification_triggers")
      .select("*")
      .eq("is_active", true);

    if (!triggers || triggers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active triggers" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = {
      abandoned_carts: 0,
      restock_alerts: 0,
      emails_sent: 0,
    };

    // Process abandoned cart reminders
    const cartTrigger = triggers.find((t: TriggerConfig) => t.trigger_type === "abandoned_cart");
    if (cartTrigger) {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - cartTrigger.delay_minutes);

      const { data: abandonedCarts } = await supabase
        .from("abandoned_carts")
        .select("*, profiles:user_id(email, full_name)")
        .eq("reminder_sent", false)
        .eq("recovered", false)
        .lt("updated_at", cutoffTime.toISOString())
        .limit(50);

      if (abandonedCarts && abandonedCarts.length > 0) {
        for (const cart of abandonedCarts) {
          const email = cart.profiles?.email;
          const name = cart.profiles?.full_name?.split(" ")[0] || "there";

          // Create in-app notification
          await supabase.from("notifications").insert({
            title: cartTrigger.title_template,
            message: cartTrigger.message_template,
            type: "promo",
            link: "/checkout",
            user_id: cart.user_id,
            is_global: false,
            is_sent: true,
          });

          // Send email if enabled and email exists
          if (cartTrigger.send_email && email && resend) {
            try {
              await resend.emails.send({
                from: "Almans <notifications@resend.dev>",
                to: [email],
                subject: cartTrigger.title_template,
                html: generateAbandonedCartEmail(name, cart.cart_data, cart.total_value),
              });
              results.emails_sent++;
            } catch (e) {
              console.error("Email send failed:", e);
            }
          }

          // Mark as sent
          await supabase
            .from("abandoned_carts")
            .update({
              reminder_sent: true,
              reminder_count: (cart.reminder_count || 0) + 1,
              last_reminder_at: new Date().toISOString(),
            })
            .eq("id", cart.id);

          results.abandoned_carts++;
        }
      }
    }

    // Process restock alerts
    const restockTrigger = triggers.find((t: TriggerConfig) => t.trigger_type === "restock");
    if (restockTrigger) {
      // Find products that are now in stock with pending alerts
      const { data: alerts } = await supabase
        .from("restock_alerts")
        .select("*, products:product_id(name, stock, slug, images), profiles:user_id(email, full_name)")
        .eq("notified", false)
        .limit(100);

      if (alerts) {
        for (const alert of alerts) {
          const product = alert.products;
          if (!product || product.stock <= 0) continue;

          const email = alert.email || alert.profiles?.email;
          const name = alert.profiles?.full_name?.split(" ")[0] || "there";

          const title = restockTrigger.title_template.replace("{{product_name}}", product.name);
          const message = restockTrigger.message_template.replace("{{product_name}}", product.name);

          // Create in-app notification
          if (alert.user_id) {
            await supabase.from("notifications").insert({
              title,
              message,
              type: "product",
              link: `/product/${product.slug}`,
              user_id: alert.user_id,
              is_global: false,
              is_sent: true,
            });
          }

          // Send email
          if (restockTrigger.send_email && email && resend) {
            try {
              await resend.emails.send({
                from: "Almans <notifications@resend.dev>",
                to: [email],
                subject: title,
                html: generateRestockEmail(name, product),
              });
              results.emails_sent++;
            } catch (e) {
              console.error("Email send failed:", e);
            }
          }

          // Mark as notified
          await supabase
            .from("restock_alerts")
            .update({ notified: true })
            .eq("id", alert.id);

          results.restock_alerts++;
        }
      }
    }

    console.log("Trigger processing complete:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error processing triggers:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function generateAbandonedCartEmail(name: string, cartData: any, total: number): string {
  const items = Array.isArray(cartData) ? cartData : [];
  const itemsHtml = items.slice(0, 3).map((item: any) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
        <strong>${item.name || 'Product'}</strong>
        ${item.size ? `<br><span style="color: #666; font-size: 12px;">Size: ${item.size}</span>` : ''}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">
        ৳${item.price || 0}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; margin: 0;">ALMANS</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 8px;">
        <p>Hi ${name},</p>
        <h2 style="color: #000; margin-top: 0;">🛒 You left something behind!</h2>
        <p>Your cart is waiting for you. Complete your purchase before these items sell out!</p>
        
        <table style="width: 100%; margin: 20px 0;">
          ${itemsHtml}
          ${items.length > 3 ? `<tr><td colspan="2" style="padding: 10px 0; color: #666;">+${items.length - 3} more items</td></tr>` : ''}
        </table>
        
        <p style="font-size: 18px; font-weight: bold;">Total: ৳${total}</p>
        
        <p style="margin-top: 20px;">
          <a href="https://almans.lovable.app/checkout" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Complete Purchase
          </a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        <p>Almans - Premium Fashion</p>
      </div>
    </body>
    </html>
  `;
}

function generateRestockEmail(name: string, product: any): string {
  const imageUrl = product.images?.[0] || '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; margin: 0;">ALMANS</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 8px;">
        <p>Hi ${name},</p>
        <h2 style="color: #000; margin-top: 0;">🔔 Great news! It's back in stock!</h2>
        <p>The item you were waiting for is now available:</p>
        
        <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0; display: flex; align-items: center; gap: 15px;">
          ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">` : ''}
          <div>
            <strong>${product.name}</strong>
            <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Only ${product.stock} left in stock!</p>
          </div>
        </div>
        
        <p style="margin-top: 20px;">
          <a href="https://almans.lovable.app/product/${product.slug}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Shop Now
          </a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        <p>Almans - Premium Fashion</p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
