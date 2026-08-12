// Glowe Play — phone upload receiver (Vercel serverless function)
// The mobile page posts { token, dataUrl } (a resized JPEG data URL). We
// validate the handoff token against upload_sessions (service role), store the
// image in the private `memories` bucket, insert the memory row, and mark the
// session done. The desktop polls the session and refreshes when it's done.
//
// Env (already set in Vercel): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const MAX_BYTES = 8 * 1024 * 1024; // generous ceiling after client-side resize

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE) return res.status(503).json({ error: "Server not configured." });

  const body = req.body && typeof req.body === "object" ? req.body
    : (() => { try { return JSON.parse(req.body || "{}"); } catch { return {}; } })();
  const token = (body.token || "").toString();
  const dataUrl = (body.dataUrl || "").toString();
  if (!token || !dataUrl) return res.status(400).json({ error: "Missing token or image." });

  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return res.status(400).json({ error: "Invalid image data." });
  const mime = m[1];
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length > MAX_BYTES) return res.status(413).json({ error: "Image too large." });

  const H = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" };

  // 1) Load + validate the session.
  const sRes = await fetch(`${SUPABASE_URL}/rest/v1/upload_sessions?id=eq.${token}&select=*`, { headers: H });
  const rows = sRes.ok ? await sRes.json() : [];
  const s = Array.isArray(rows) && rows[0];
  if (!s) return res.status(404).json({ error: "This upload link is invalid." });
  if (s.status !== "pending") return res.status(409).json({ error: "This link was already used." });
  if (new Date(s.expires_at).getTime() < Date.now()) return res.status(410).json({ error: "This link expired. Generate a new QR code." });

  // 2) Store the image (service role bypasses storage RLS).
  const ext = mime === "image/png" ? "png" : (mime === "image/webp" ? "webp" : "jpg");
  const path = `${s.child_id}/${s.badge_id}/${s.kind}-${Date.now().toString(36)}.${ext}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/memories/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE}`, apikey: SERVICE, "Content-Type": mime, "x-upsert": "true" },
    body: buffer,
  });
  if (!up.ok) return res.status(500).json({ error: "Could not save the photo." });

  // 3) Insert the memory row.
  const mem = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
    method: "POST", headers: H,
    body: JSON.stringify({ child_id: s.child_id, badge_id: s.badge_id, kind: s.kind, url: path }),
  });
  if (!mem.ok) return res.status(500).json({ error: "Could not record the memory." });

  // 4) Mark the session done so the desktop picks it up.
  await fetch(`${SUPABASE_URL}/rest/v1/upload_sessions?id=eq.${token}`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ status: "done", result_path: path }),
  });

  return res.status(200).json({ ok: true });
};
