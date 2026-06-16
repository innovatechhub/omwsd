import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StaffRole = "admin" | "social_worker";

interface CreateStaffUserBody {
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
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
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();

  if (callerError || !caller) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .maybeSingle();

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500);
  }

  if (callerProfile?.role !== "admin" && callerProfile?.role !== "super_admin") {
    return jsonResponse({ error: "Only administrators can add staff users." }, 403);
  }

  let body: CreateStaffUserBody;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const fullName = body.fullName?.trim() ?? "";
  const password = body.password ?? "";
  const role = body.role;

  if (!fullName) {
    return jsonResponse({ error: "Full name is required." }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Enter a valid email address." }, 400);
  }

  if (password.length < 8) {
    return jsonResponse({ error: "Password must be at least 8 characters." }, 400);
  }

  if (!isStaffRole(role)) {
    return jsonResponse({ error: "Invalid staff role." }, 400);
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      is_active: true,
    },
  });

  if (createError || !createdUser.user) {
    return jsonResponse(
      { error: createError?.message ?? "Unable to create staff user." },
      createError?.status ?? 500,
    );
  }

  const { data: setting, error: settingFetchError } = await serviceClient
    .from("settings")
    .select("setting_value")
    .eq("setting_key", "staff_roles")
    .maybeSingle();

  if (settingFetchError) {
    return jsonResponse({ error: settingFetchError.message }, 500);
  }

  const currentRoles =
    setting?.setting_value && typeof setting.setting_value === "object"
      ? (setting.setting_value as Record<string, unknown>)
      : {};

  const { error: settingError } = await serviceClient.from("settings").upsert(
    {
      setting_key: "staff_roles",
      setting_value: {
        ...currentRoles,
        [email]: role,
      },
      description: "staff_roles",
    },
    {
      onConflict: "setting_key",
    },
  );

  if (settingError) {
    return jsonResponse({ error: settingError.message }, 500);
  }

  await serviceClient.from("audit_logs").insert({
    actor_id: caller.id,
    action: "staff.created",
    entity_type: "profile",
    entity_id: createdUser.user.id,
    metadata: {
      email,
      role,
    },
  });

  return jsonResponse({ userId: createdUser.user.id });
});
