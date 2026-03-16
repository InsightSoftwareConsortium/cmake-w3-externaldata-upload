import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { auth, getSession } from "./auth";
import { createDelegation } from "./delegation";
import { checkUploadAllowed, logUpload } from "./upload-log";
import { sendUploadNotification } from "./email";

const app = new Hono<{ Bindings: Env }>();

// --- CORS middleware ---
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      // Allow the configured frontend URL and localhost for dev
      const allowed = [
        c.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:4173",
      ].filter(Boolean);
      if (allowed.includes(origin)) return origin;
      return null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// --- Auth routes ---
app.route("/auth", auth);

// --- API routes (require authentication) ---

// POST /api/delegation
// Request body: { agentDid: string, fileName: string, fileSize: number }
// Returns: delegation bytes as application/octet-stream
app.post("/api/delegation", async (c) => {
  const session = await getSession(
    c.req.header("Cookie"),
    c.env.SESSION_SECRET
  );
  if (!session) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const body = await c.req.json<{
    agentDid: string;
    fileName: string;
    fileSize: number;
  }>();

  const { agentDid, fileName, fileSize } = body;
  if (
    !agentDid || typeof agentDid !== "string" ||
    !fileName || typeof fileName !== "string" ||
    typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize < 0
  ) {
    return c.json(
      { error: "Missing or invalid fields: agentDid, fileName, fileSize" },
      400
    );
  }

  // Check quota and blacklist
  const check = await checkUploadAllowed(
    c.env.DB,
    session.github_id,
    session.email,
    fileSize
  );
  if (!check.allowed) {
    return c.json({ error: check.error }, 403);
  }

  try {
    // Create UCAN delegation for the browser agent
    const delegationBytes = await createDelegation({
      storachaKey: c.env.STORACHA_KEY,
      storachaProof: c.env.STORACHA_PROOF,
      audienceDid: agentDid,
    });

    return new Response(delegationBytes, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Delegation creation failed:", err);
    return c.json({ error: "Failed to create upload delegation" }, 500);
  }
});

// POST /api/upload-complete
// Request body: { cid: string, fileName: string, fileSize: number }
// Logs the upload and sends email notification
app.post("/api/upload-complete", async (c) => {
  const session = await getSession(
    c.req.header("Cookie"),
    c.env.SESSION_SECRET
  );
  if (!session) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const body = await c.req.json<{
    cid: string;
    fileName: string;
    fileSize: number;
  }>();

  const { cid, fileName, fileSize } = body;
  if (
    !cid || typeof cid !== "string" ||
    !fileName || typeof fileName !== "string" ||
    typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize < 0
  ) {
    return c.json(
      { error: "Missing or invalid fields: cid, fileName, fileSize" },
      400
    );
  }

  // Re-check blacklist and quota before logging (prevents log/email spam)
  const check = await checkUploadAllowed(
    c.env.DB,
    session.github_id,
    session.email,
    fileSize
  );
  if (!check.allowed) {
    return c.json({ error: check.error }, 403);
  }

  // Log to D1
  await logUpload(
    c.env.DB,
    session.github_id,
    session.email,
    fileName,
    fileSize,
    cid
  );

  // Send notification email (fire and forget via waitUntil if available)
  const emailPromise = sendUploadNotification({
    apiKeyPublic: c.env.MJ_APIKEY_PUBLIC,
    apiKeyPrivate: c.env.MJ_APIKEY_PRIVATE,
    senderEmail: c.env.SENDER_EMAIL,
    recipientEmail: c.env.RECIPIENT_EMAIL,
    email: session.email,
    authId: session.github_id,
    fileName,
    fileSize,
    cid,
  });

  // Use waitUntil to not block the response on email sending
  c.executionCtx.waitUntil(emailPromise);

  return c.json({ ok: true, cid });
});

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
