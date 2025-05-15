/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase setup
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Email setup
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const fromEmail = "Check-In Bot <onboarding@resend.dev>";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Reject non-POST requests
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Parse JSON safely
  let senderName = "Someone";
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response("Unsupported content type", { status: 400 });
    }

    const body = await req.json();
    senderName = body?.name || "Someone";
  } catch (err) {
    console.error("❌ Invalid JSON:", err.message);
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("❌ Error fetching users:", error.message);
      return new Response("User fetch failed", { status: 500 });
    }

    const subject = "📬 New Monthly Check-in Submitted!";
    const text = `${senderName} just submitted their monthly check-in. Come share yours too!`;

    for (const user of data.users || []) {
      if (!user.email) continue;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: user.email,
          subject,
          text,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error(`❌ Failed to email ${user.email}: ${msg}`);
      }
    }

    return new Response("✅ Emails sent", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("❌ Function error:", err.message);
    return new Response("Internal server error", { status: 500 });
  }
});
