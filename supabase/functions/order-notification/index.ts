import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Format items list
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

    // Return the formatted message for WhatsApp integration
    // The business phone number should be retrieved from settings
    const businessPhone = Deno.env.get('BUSINESS_PHONE') || '8801930278877';
    const whatsappUrl = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order notification processed',
        whatsappUrl,
        notificationMessage: message
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
