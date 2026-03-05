import { Hono } from "hono";
import type { Env, SessionPayload } from "./types";

const auth = new Hono<{ Bindings: Env }>();

// --- Session cookie helpers using HMAC-SHA256 ---

async function getSigningKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function createSessionToken(
  payload: SessionPayload,
  secret: string
): Promise<string> {
  const key = await getSigningKey(secret);
  const data = JSON.stringify(payload);
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const b64data = btoa(data);
  return `${b64data}.${sig}`;
}

async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    const [b64data, sig] = token.split(".");
    if (!b64data || !sig) return null;

    const data = atob(b64data);
    const key = await getSigningKey(secret);
    const enc = new TextEncoder();

    const sigBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      enc.encode(data)
    );
    if (!valid) return null;

    const payload: SessionPayload = JSON.parse(data);

    // Check expiry
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

function sessionCookie(token: string, maxAge: number): string {
  return `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie(): string {
  return `session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// --- Middleware: extract session from cookie ---

export async function getSession(
  cookie: string | undefined,
  secret: string
): Promise<SessionPayload | null> {
  if (!cookie) return null;
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;
  return verifySessionToken(match[1], secret);
}

// --- Routes ---

// GET /auth/login - Redirect to GitHub OAuth
auth.get("/login", (c) => {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: `${new URL(c.req.url).origin}/auth/callback`,
    scope: "user:email",
    state,
  });

  // Store state in a short-lived cookie for CSRF protection
  const response = c.redirect(
    `https://github.com/login/oauth/authorize?${params}`
  );
  response.headers.set(
    "Set-Cookie",
    `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  return response;
});

// GET /auth/callback - Handle GitHub OAuth callback
auth.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const cookie = c.req.header("Cookie");

  // Verify state for CSRF
  const stateMatch = cookie?.match(/oauth_state=([^;]+)/);
  if (!state || !stateMatch || stateMatch[1] !== state) {
    return c.json({ error: "Invalid OAuth state" }, 403);
  }

  if (!code) {
    return c.json({ error: "Missing authorization code" }, 400);
  }

  // Exchange code for access token
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
  };
  if (!tokenData.access_token) {
    return c.json({ error: "Failed to get access token" }, 401);
  }

  // Get user info from GitHub
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "cmake-w3-externaldata-upload",
    },
  });
  const user = (await userResponse.json()) as {
    id: number;
    login: string;
    email: string | null;
  };

  // Get primary email if not public
  let email = user.email;
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "cmake-w3-externaldata-upload",
      },
    });
    const emails = (await emailsResponse.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primary = emails.find((e) => e.primary && e.verified);
    email = primary?.email ?? emails[0]?.email ?? null;
  }

  if (!email) {
    return c.json({ error: "Could not retrieve email from GitHub" }, 400);
  }

  // Create session token (24 hour expiry)
  const sessionPayload: SessionPayload = {
    github_id: String(user.id),
    email,
    login: user.login,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };

  const token = await createSessionToken(
    sessionPayload,
    c.env.SESSION_SECRET
  );

  // Redirect to frontend with session cookie set
  const frontendUrl = c.env.FRONTEND_URL || new URL(c.req.url).origin;
  const response = c.redirect(frontendUrl);
  response.headers.append("Set-Cookie", sessionCookie(token, 86400));
  // Clear the oauth_state cookie
  response.headers.append(
    "Set-Cookie",
    `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  return response;
});

// GET /auth/me - Return current user info
auth.get("/me", async (c) => {
  const session = await getSession(
    c.req.header("Cookie"),
    c.env.SESSION_SECRET
  );
  if (!session) {
    return c.json({ authenticated: false }, 401);
  }
  return c.json({
    authenticated: true,
    github_id: session.github_id,
    email: session.email,
    login: session.login,
  });
});

// POST /auth/logout - Clear session
auth.post("/logout", (c) => {
  const response = c.json({ ok: true });
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
});

export { auth };
