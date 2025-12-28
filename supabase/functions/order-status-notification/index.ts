import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface StatusChangePayload {
  orderId: string;
  orderNumber: string;
  newStatus: string;
  oldStatus?: string;
  trackingNumber?: string;
  customerEmail?: string;
  customerName?: string;
}

const statusMessages: Record<string, { emoji: string; title: string; message: string; color: string }> = {
  pending: {
    emoji: '🕐',
    title: 'Order Received',
    message: 'We have received your order and it is awaiting processing.',
    color: '#f59e0b',
  },
  processing: {
    emoji: '⚡',
    title: 'Order Being Processed',
    message: 'Great news! Your order is now being prepared and packaged with care.',
    color: '#3b82f6',
  },
  shipped: {
    emoji: '🚚',
    title: 'Order Shipped',
    message: 'Your order is on its way! It has been handed over to our delivery partner.',
    color: '#22c55e',
  },
  delivered: {
    emoji: '✅',
    title: 'Order Delivered',
    message: 'Your order has been delivered successfully. We hope you love your purchase!',
    color: '#10b981',
  },
  cancelled: {
    emoji: '❌',
    title: 'Order Cancelled',
    message: 'Your order has been cancelled. If you have any questions, please contact us.',
    color: '#ef4444',
  },
};

async function sendStatusEmail(payload: StatusChangePayload) {
  if (!RESEND_API_KEY) {
    console.log('Email notification skipped: missing RESEND_API_KEY');
    return { success: false, error: 'Missing API key' };
  }

  const { orderNumber, newStatus, trackingNumber, customerEmail, customerName } = payload;
  const statusInfo = statusMessages[newStatus] || statusMessages.pending;

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
          <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, ${statusInfo.color} 0%, ${adjustColor(statusInfo.color, -20)} 100%);">
            <div style="font-size: 48px; margin-bottom: 10px;">${statusInfo.emoji}</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${statusInfo.title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #333; margin: 0 0 20px;">Hi ${customerName || 'Valued Customer'},</p>
            <p style="font-size: 16px; color: #666; line-height: 1.6; margin: 0 0 30px;">
              ${statusInfo.message}
            </p>
            
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6b7280; font-size: 14px;">Order Number</span>
                  </td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="color: #111827; font-weight: bold; font-size: 14px;">#${orderNumber}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px;">Status</span>
                  </td>
                  <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; text-align: right;">
                    <span style="display: inline-block; padding: 4px 12px; background-color: ${statusInfo.color}; color: #ffffff; border-radius: 16px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                      ${newStatus}
                    </span>
                  </td>
                </tr>
                ${trackingNumber ? `
                <tr>
                  <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px;">Tracking Number</span>
                  </td>
                  <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #111827; font-weight: bold; font-size: 14px; font-family: monospace;">${trackingNumber}</span>
                  </td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${newStatus === 'delivered' ? `
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <p style="margin: 0; font-size: 16px; color: #92400e;">
                ⭐ Enjoying your purchase? We'd love to hear your feedback!
              </p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://almans.com/order-tracking/${orderNumber}" 
                 style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                View Order Details
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
        subject: `${statusInfo.emoji} Order #${orderNumber} - ${statusInfo.title}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send status email:', errorData);
      return { success: false, error: errorData };
    }

    const result = await response.json();
    console.log('Status email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: StatusChangePayload = await req.json();
    console.log('Order status change notification payload:', payload);

    const { orderId, orderNumber, newStatus, trackingNumber } = payload;
    let { customerEmail, customerName } = payload;

    // Get customer info if not provided
    if (!customerEmail) {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, guest_email')
        .eq('id', orderId)
        .single();

      if (order?.guest_email) {
        customerEmail = order.guest_email;
      } else if (order?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', order.user_id)
          .single();

        if (profile?.email) {
          customerEmail = profile.email;
          if (!customerName && profile.full_name) {
            customerName = profile.full_name;
          }
        }
      }
    }

    if (!customerEmail) {
      console.log('No customer email found for order:', orderId);
      return new Response(
        JSON.stringify({ success: false, error: 'No customer email found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check user notification preferences
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (order?.user_id) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email_enabled, order_updates')
        .eq('user_id', order.user_id)
        .single();

      if (prefs && (!prefs.email_enabled || !prefs.order_updates)) {
        console.log('User has disabled order update emails');
        return new Response(
          JSON.stringify({ success: false, error: 'User has disabled order notifications' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    const emailResult = await sendStatusEmail({
      orderId,
      orderNumber,
      newStatus,
      trackingNumber,
      customerEmail,
      customerName,
    });

    // Log the notification
    await supabase.from('notifications').insert({
      user_id: order?.user_id || null,
      title: `Order ${newStatus}`,
      message: `Your order #${orderNumber} status has been updated to ${newStatus}`,
      type: 'order',
      is_global: false,
      is_sent: emailResult.success,
    });

    return new Response(
      JSON.stringify({ 
        success: emailResult.success, 
        message: emailResult.success ? 'Status notification sent' : 'Failed to send notification',
        details: emailResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Order status notification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
