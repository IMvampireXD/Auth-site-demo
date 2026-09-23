import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  try {
    const { name, password } = await req.json();
    if (typeof name !== "string" || typeof password !== "string" || !name.trim() || !password) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 400, headers: cors });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: email, error: lookupError } = await admin.rpc("get_email_for_name", { p_name: name.trim() });

    // Do not reveal whether a name exists.
    if (lookupError || !email) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: cors });
    }

    const tokenResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": anonKey },
      body: JSON.stringify({ email, password }),
    });

    const token = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: cors });
    }

    return new Response(JSON.stringify({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
    }), { status: 200, headers: cors });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: cors });
  }
});
