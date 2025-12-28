import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

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
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action") || "unsubscribe";

    if (!email) {
      return new Response(
        generateHtmlPage("Error", "Invalid link. Email is missing.", "error", null, null),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Validate token (simple hash of email for basic security)
    const expectedToken = await generateToken(email);
    if (token !== expectedToken) {
      return new Response(
        generateHtmlPage("Error", "Invalid or expired link.", "error", null, null),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "resubscribe") {
      // Re-subscribe the user
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active: true })
        .eq("email", email);

      if (error) {
        console.error("Re-subscribe error:", error);
        return new Response(
          generateHtmlPage("Error", "Failed to re-subscribe. Please try again later.", "error", null, null),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      console.log(`Successfully re-subscribed: ${email}`);

      return new Response(
        generateHtmlPage(
          "Welcome Back!",
          `You have been successfully re-subscribed to Almans newsletter. You will now receive our latest updates and exclusive offers.`,
          "success",
          email,
          token
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    } else {
      // Unsubscribe the user
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active: false })
        .eq("email", email);

      if (error) {
        console.error("Unsubscribe error:", error);
        return new Response(
          generateHtmlPage("Error", "Failed to unsubscribe. Please try again later.", "error", null, null),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      console.log(`Successfully unsubscribed: ${email}`);

      return new Response(
        generateHtmlPage(
          "Unsubscribed Successfully",
          `You have been successfully unsubscribed from Almans newsletter. You will no longer receive promotional emails from us.`,
          "unsubscribed",
          email,
          token
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }
  } catch (error) {
    console.error("Newsletter action error:", error);
    return new Response(
      generateHtmlPage("Error", "An unexpected error occurred.", "error", null, null),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
});

async function generateToken(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email + "almans-newsletter-secret");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

function generateHtmlPage(
  title: string, 
  message: string, 
  status: "success" | "error" | "unsubscribed",
  email: string | null,
  token: string | null
): string {
  const colors = {
    success: { bg: "#f0fdf4", text: "#166534", icon: "#22c55e" },
    error: { bg: "#fef2f2", text: "#991b1b", icon: "#ef4444" },
    unsubscribed: { bg: "#fefce8", text: "#854d0e", icon: "#eab308" },
  };
  
  const { bg, text: textColor, icon: iconColor } = colors[status];
  
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    unsubscribed: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const resubscribeUrl = email && token 
    ? `${supabaseUrl}/functions/v1/newsletter-unsubscribe?email=${encodeURIComponent(email)}&token=${token}&action=resubscribe`
    : null;

  const resubscribeButton = status === "unsubscribed" && resubscribeUrl
    ? `
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px; margin-bottom: 16px;">Changed your mind?</p>
        <a href="${resubscribeUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Re-subscribe to Newsletter
        </a>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Almans Newsletter</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 48px;
          max-width: 480px;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .icon { margin-bottom: 24px; }
        h1 {
          color: ${textColor};
          font-size: 24px;
          margin-bottom: 16px;
        }
        p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .status-box {
          background: ${bg};
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .status-box p {
          color: ${textColor};
          margin: 0;
          font-weight: 500;
        }
        .brand {
          color: #999;
          font-size: 14px;
        }
        a.home-link {
          color: #1a1a1a;
          text-decoration: none;
          font-weight: 600;
        }
        a.home-link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${icons[status]}</div>
        <h1>${title}</h1>
        <div class="status-box">
          <p>${message}</p>
        </div>
        ${resubscribeButton}
        <p class="brand" style="margin-top: 24px;">
          <a href="https://almans.lovable.app" class="home-link">← Return to Almans Store</a>
        </p>
      </div>
    </body>
    </html>
  `;
}
