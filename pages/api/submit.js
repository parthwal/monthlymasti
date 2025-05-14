// pages/api/submit.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log(">>> /api/submit called");
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log(
    "SERVICE_ROLE_KEY is set?",
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Initialize the admin client at request time (server-only)
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Ensure we actually got a JSON payload
  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  // Perform the upsert with your unique key
  const { error } = await supabaseAdmin
    .from("submissions")
    .upsert(payload, { onConflict: "form_timestamp" });

  if (error) {
    console.error("RLS upsert error:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
