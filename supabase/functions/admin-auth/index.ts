// supabase/functions/admin-auth/index.ts
//
// Two-step admin login, built so the password shown in the site's UI never
// has to live inside the website's own code — anyone can read a static
// site's JavaScript, so anything hardcoded there is not a secret.
//
// Step 1 (POST { step: "request", username, password }):
//   Checks username + password against secrets that live only in this
//   function's environment. If correct, emails a 6-digit code to the real
//   admin inbox (also a secret — the frontend never sees or sends it).
//
// Step 2 (POST { step: "verify", code }):
//   Checks the code and, if correct, returns a real Supabase session. The
//   first time this ever succeeds, it also promotes that account to admin
//   in the `admins` table — no separate manual setup step needed.
//
// DEPLOY:
//   supabase functions deploy admin-auth
//
// SECRETS (set once, replace with the real values):
//   supabase secrets set ADMIN_USERNAME=admin.idf
//   supabase secrets set ADMIN_PASSWORD='IDF.4U'
//   supabase secrets set ADMIN_EMAIL=m.mithesh11122006@gmail.com
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// the Supabase platform to every Edge Function — nothing to set for those.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADMIN_USERNAME = Deno.env.get('ADMIN_USERNAME') ?? '';
const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') ?? '';
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

// Tighten this to the site's real domain once it's live, e.g.
// 'https://www.indesignluxuryfabrics.com' — '*' is fine for getting this
// working first.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_EMAIL) {
    return json(
      {
        error:
          'Admin login is not configured yet. Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_EMAIL as function secrets — see the comment at the top of this file.',
      },
      500,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  // ---------------- STEP 1: username + password -> email a code ----------------
  if (body.step === 'request') {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await admin
      .from('admin_login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('success', false)
      .gte('attempted_at', since);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return json({ error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` }, 429);
    }

    const ok = body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD;
    await admin.from('admin_login_attempts').insert({ success: ok, ip });

    if (!ok) {
      return json({ error: 'Incorrect username or password' }, 401);
    }

    const { error } = await admin.auth.signInWithOtp({
      email: ADMIN_EMAIL,
      options: { shouldCreateUser: true },
    });
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true });
  }

  // ---------------- STEP 2: 6-digit code -> a real session ----------------
  if (body.step === 'verify') {
    const code = String(body.code ?? '').trim();
    if (!/^\d{6}$/.test(code)) return json({ error: 'Enter the 6-digit code' }, 400);

    const { data, error } = await admin.auth.verifyOtp({
      email: ADMIN_EMAIL,
      token: code,
      type: 'email',
    });

    if (error || !data.session || !data.user) {
      return json({ error: error?.message ?? 'That code is incorrect or has expired' }, 401);
    }

    // First successful login ever promotes this account to admin — nothing
    // to configure by hand in the admins table.
    await admin.from('admins').upsert({ user_id: data.user.id }, { onConflict: 'user_id' });

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }

  return json({ error: 'Unknown request' }, 400);
});
