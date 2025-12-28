import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface OrderNotificationPayload {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryArea: string;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
}

async function sendEmailNotification(
  adminEmail: string, 
  payload: OrderNotificationPayload
) {
  if (!RESEND_API_KEY || !adminEmail) {
    console.log('Email notification skipped: missing API key or admin email');
    return null;
  }

  const { orderNumber, customerName, customerPhone, customerAddress, deliveryArea, items, subtotal, deliveryFee, total, notes } = payload;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.size || 'N/A'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">৳${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

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
          <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🛍️ NEW ORDER RECEIVED</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 20px;">
              <strong style="font-size: 18px;">Order #${orderNumber}</strong>
            </div>
            
            <h3 style="color: #333; margin-top: 20px;">Customer Details</h3>
            <p><strong>Name:</strong> ${customerName}</p>
            <p><strong>Phone:</strong> ${customerPhone}</p>
            <p><strong>Address:</strong> ${customerAddress}</p>
            <p><strong>Area:</strong> ${deliveryArea === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            
            <h3 style="color: #333; margin-top: 20px;">Order Items</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-collapse: collapse;">
              <tr style="background-color: #f9f9f9;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Item</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Size</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Qty</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Price</th>
              </tr>
              ${itemsHtml}
            </table>
            
            <div style="margin-top: 20px; text-align: right;">
              <p>Subtotal: <strong>৳${subtotal.toLocaleString()}</strong></p>
              <p>Delivery: <strong>৳${deliveryFee.toLocaleString()}</strong></p>
              <p style="font-size: 18px; color: #22c55e;">Total: <strong>৳${total.toLocaleString()}</strong></p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 12px;">This is an automated notification from Almans Store.</p>
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
        from: "Almans Orders <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `🛍️ New Order #${orderNumber} - ৳${total.toLocaleString()}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send email notification:', errorData);
      return { success: false, error: errorData };
    }

    const result = await response.json();
    console.log('Email notification sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Email notification error:', error);
    return { success: false, error };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: OrderNotificationPayload = await req.json();
    console.log('Order notification received:', payload);

    const { 
      orderNumber, 
      customerName, 
      customerPhone, 
      customerAddress, 
      deliveryArea,
      items, 
      subtotal, 
      deliveryFee, 
      total,
      notes 
    } = payload;

    // Fetch settings from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let businessPhone = Deno.env.get('BUSINESS_PHONE') || '8801930278877';
    let adminEmail = '';
    
    try {
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['whatsapp_notification_phone', 'admin_notification_email']);
      
      if (settingsData) {
        for (const setting of settingsData) {
          if (setting.key === 'whatsapp_notification_phone' && setting.value) {
            businessPhone = setting.value.replace(/[^0-9]/g, '');
            console.log('Using WhatsApp notification phone from settings:', businessPhone);
          }
          if (setting.key === 'admin_notification_email' && setting.value) {
            adminEmail = setting.value;
            console.log('Using admin notification email from settings:', adminEmail);
          }
        }
      }
    } catch (settingsError) {
      console.log('Could not fetch settings:', settingsError);
    }

    // Send email notification if admin email is configured
    let emailResult = null;
    if (adminEmail) {
      emailResult = await sendEmailNotification(adminEmail, payload);
    }

    // Format items list for WhatsApp
    const itemsList = items.map(item => 
      `• ${item.name} | Size: ${item.size} | Qty: ${item.quantity} | ৳${item.price * item.quantity}`
    ).join('\n');

    // Create notification message
    const message = `🛍️ NEW ORDER RECEIVED!\n\n` +
      `📦 Order: ${orderNumber}\n\n` +
      `👤 Customer: ${customerName}\n` +
      `📞 Phone: ${customerPhone}\n` +
      `📍 Address: ${customerAddress}\n` +
      `🚚 Area: ${deliveryArea === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}\n\n` +
      `🛒 Items:\n${itemsList}\n\n` +
      `💰 Subtotal: ৳${subtotal}\n` +
      `🚚 Delivery: ৳${deliveryFee}\n` +
      `💵 Total: ৳${total}\n` +
      (notes ? `\n📝 Notes: ${notes}` : '');

    console.log('Notification message:', message);
    console.log('Sending to WhatsApp:', businessPhone);

    // Return the formatted message for WhatsApp integration
    const whatsappUrl = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order notification processed',
        whatsappUrl,
        notificationMessage: message,
        emailSent: emailResult?.success || false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Order notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
