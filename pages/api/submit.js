// pages/api/submit.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log(">>> /api/submit called");

  // Only allow POST, and respond in JSON if it’s not
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Parse JSON payload
  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    console.error("Invalid JSON body:", err);
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  // Initialize admin client (service role)
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1) Upsert into submissions table
  const { error: dbError } = await supabaseAdmin
    .from("submissions")
    .upsert(payload, { onConflict: "form_timestamp" });

  if (dbError) {
    console.error("Database upsert error:", dbError);
    return res.status(500).json({ error: dbError.message });
  }

  // 2) Invoke your notify-users Edge Function
  try {
    const { error: notifError } = await supabaseAdmin.functions.invoke(
      "notify-users",
      { body: { name: payload.name || "Someone" } }
    );
    if (notifError) {
      console.error("Notification function error:", notifError);
      // don’t fail the entire request—just log it
    }
  } catch (fnErr) {
    console.error("Failed to invoke notify-users:", fnErr);
  }

  // 3) Return success JSON
  return res.status(200).json({ success: true });
}
