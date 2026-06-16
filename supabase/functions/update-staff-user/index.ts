import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StaffRole = "admin" | "social_worker";

interface UpdateStaffUserBody {
  userId?: string;
  fullName?: string;
  role?: string;
  password?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isStaffRole(value: string | undefined): value is StaffRole {
  return value === "admin" || value === "social_worker";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse({ error: "Supabase function environment is not configured." }, 500);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return jsonResponse({ error: "Missing authorization header." }, 401);
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });

  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .maybeSingle();

  if (profileError) return jsonResponse({ error: profileError.message }, 500);
  if (callerProfile?.role !== "admin" && callerProfile?.role !== "super_admin") {
    return jsonResponse({ error: "Only administrators can update staff users." }, 403);
  }

  let body: UpdateStaffUserBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const { userId, fullName, role, password } = body;

  if (!userId) return jsonResponse({ error: "User ID is required." }, 400);

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Build auth update payload
  const authUpdate: Record<string, unknown> = {};
  if (password) {
    if (password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters." }, 400);
    }
    authUpdate.password = password;
  }
  if (fullName) authUpdate.user_metadata = { full_name: fullName };

  if (Object.keys(authUpdate).length > 0) {
    const { error: authError } = await serviceClient.auth.admin.updateUserById(userId, authUpdate);
    if (authError) return jsonResponse({ error: authError.message }, 500);
  }

  // Update profile row
  const profileUpdate: Record<string, unknown> = {};
  if (fullName?.trim()) profileUpdate.full_name = fullName.trim();
  if (role && isStaffRole(role)) profileUpdate.role = role;

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileUpdateError } = await serviceClient
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);
    if (profileUpdateError) return jsonResponse({ error: profileUpdateError.message }, 500);
  }

  await serviceClient.from("audit_logs").insert({
    actor_id: caller.id,
    action: "staff.updated",
    entity_type: "profile",
    entity_id: userId,
    metadata: { updated_fields: Object.keys({ ...authUpdate, ...profileUpdate }) },
  });

  return jsonResponse({ success: true });
});
