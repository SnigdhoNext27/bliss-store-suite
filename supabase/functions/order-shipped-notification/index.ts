import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface ShippedNotificationPayload {
  orderId: string;
  orderNumber: string;
  trackingNumber?: string;
  customerEmail: string;
  customerName: string;
  estimatedDelivery?: string;
}

async function sendShippedEmail(payload: ShippedNotificationPayload) {
  if (!RESEND_API_KEY) {
    console.log('Email notification skipped: missing RESEND_API_KEY');
    return { success: false, error: 'Missing API key' };
  }

  const { orderNumber, trackingNumber, customerEmail, customerName, estimatedDelivery } = payload;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
          <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
            <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Your Order is On The Way!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #333; margin: 0 0 20px;">Hi ${customerName},</p>
            <p style="font-size: 16px; color: #666; line-height: 1.6; margin: 0 0 30px;">
              Great news! Your order <strong>#${orderNumber}</strong> has been shipped and is on its way to you.
            </p>
            
            ${trackingNumber ? `
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #bae6fd;">
              <h3 style="margin: 0 0 15px; color: #0369a1; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Tracking Information</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0c4a6e; font-family: monospace; letter-spacing: 2px;">${trackingNumber}</p>
              <p style="margin: 10px 0 0; font-size: 14px; color: #0369a1;">Use this tracking number to monitor your delivery status</p>
            </div>
            ` : ''}
            
            ${estimatedDelivery ? `
            <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #fcd34d;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>📅 Estimated Delivery:</strong> ${estimatedDelivery}
              </p>
            </div>
            ` : ''}
            
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 15px; color: #374151; font-size: 16px;">What's Next?</h3>
              <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px; line-height: 2;">
                <li>Keep your phone accessible for delivery updates</li>
                <li>Prepare payment if you chose Cash on Delivery</li>
                <li>Check your package upon delivery</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://almans.com/order-tracking/${orderNumber}" 
                 style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Track Your Order
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0 0 10px; font-size: 14px;">Need help? Contact us anytime</p>
            <p style="margin: 0;">
              <a href="https://wa.me/8801930278877" style="color: #22c55e; text-decoration: none; font-weight: 600;">WhatsApp Support</a>
            </p>
            <p style="color: #9ca3af; margin: 20px 0 0; font-size: 12px;">© ${new Date().getFullYear()} Almans. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Almans <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `🚚 Your Order #${orderNumber} Has Been Shipped!`,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send shipped email:', errorData);
      return { success: false, error: errorData };
    }

    const result = await response.json();
    console.log('Shipped email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ShippedNotificationPayload = await req.json();
    console.log('Shipped notification payload:', payload);

    const { orderId, orderNumber, trackingNumber, customerEmail, customerName, estimatedDelivery } = payload;

    if (!customerEmail) {
      // Try to get email from order or profile
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, guest_email')
        .eq('id', orderId)
        .single();

      if (order?.guest_email) {
        payload.customerEmail = order.guest_email;
      } else if (order?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', order.user_id)
          .single();

        if (profile?.email) {
          payload.customerEmail = profile.email;
          if (!customerName && profile.full_name) {
            payload.customerName = profile.full_name;
          }
        }
      }
    }

    if (!payload.customerEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'No customer email found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const emailResult = await sendShippedEmail(payload);

    return new Response(
      JSON.stringify({ 
        success: emailResult.success, 
        message: emailResult.success ? 'Shipped notification sent' : 'Failed to send notification',
        details: emailResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Shipped notification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
