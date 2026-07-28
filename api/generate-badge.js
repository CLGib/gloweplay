// Glowe Play — badge image generator (Vercel Serverless Function)
// Mirrors the Mom Ops mockup route: admin-gated, fixed style rules, Google Gemini
// native image generation, result uploaded to the Supabase `badge-art` bucket.
//
// Vercel → Project → Settings → Environment Variables (then redeploy):
//   GEMINI_API_KEY             (from https://aistudio.google.com/app/api-keys)
//   SUPABASE_URL               https://rjufqwngmfnpkigtaukj.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Project Settings → API → service_role) — SECRET
//
// No npm dependencies: uses global fetch/Buffer (Node 18+ on Vercel).

const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";
const FALLBACK_MODEL = "gemini-2.0-flash-exp";

const PALETTE =
  "Colors: deep navy #243B6B, sky teal #4EA8DE, sunshine gold #F4C542, adventure red #F25F5C, leaf green #5CB85C, warm cream #FFF8F0.";

function accentName(type, accent) {
  if (accent && accent !== "auto" && String(accent).startsWith("#")) return `the color ${accent}`;
  if (type === "milestone") return "gold";
  if (type === "tradition") return "red";
  return "teal";
}

function buildBadgePrompt(input) {
  const line1 = input.line1 || "";
  const line2 = input.line2 || "";
  const type = input.type || "adventure";
  const description = input.description || "";
  const accent = accentName(type, input.accent || "auto");
  const scene = input.scene_prompt || `a friendly flat-illustration scene about "${line1} ${line2}"`;
  return `Create a single circular achievement badge sticker, flat vector illustration, centered on a plain off-white background. Square image.
The badge is a perfect circle with a thick ${accent} outer ring and a clean white sticker border with a soft drop shadow.
Top ~55%: a flat-illustration night scene — ${scene} — set against a deep navy sky with a few small stars and a crescent moon. A small circular ${accent} camera icon chip overlaps the badge at the top-left edge.
Bottom ~45%: a white panel. Show the title on two lines — "${line1}" in bold navy uppercase, and "${line2}" in ${accent} uppercase beneath it — then a thin divider, then the caption "${description}" in small navy text.
Along the very bottom, a curved ${accent} banner reads "ADVENTURE COMPLETED!" with a white check-mark circle flanked by two small gold stars.
Style: modern children's-brand, cheerful, rounded, high detail, crisp flat colors, no photographic elements. Spell all text exactly and correctly. ${PALETTE}`;
}

function extractImages(resp) {
  const out = [];
  const parts = resp && resp.candidates && resp.candidates[0] && resp.candidates[0].content && resp.candidates[0].content.parts;
  if (Array.isArray(parts)) for (const p of parts) if (p && p.inlineData && p.inlineData.data) out.push(p.inlineData.data);
  return out;
}

async function callGemini(model, apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!GEMINI_API_KEY) return res.status(503).json({ error: "GEMINI_API_KEY is not set in Vercel env vars." });
  if (!SUPABASE_URL || !SERVICE) return res.status(503).json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in Vercel env vars." });

  // 1) Identify caller from their Supabase access token, confirm admin.
  const authHeader = req.headers["authorization"] || req.headers["Authorization"] || "";
  const userToken = String(authHeader).replace(/^Bearer\s+/i, "");
  if (!userToken) return res.status(401).json({ error: "Missing Authorization token." });

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${userToken}`, apikey: SERVICE },
  });
  if (!userRes.ok) return res.status(401).json({ error: "Not signed in." });
  const userJson = await userRes.json();
  const uid = userJson && userJson.id;
  if (!uid) return res.status(401).json({ error: "Could not resolve user." });

  const adminRes = await fetch(`${SUPABASE_URL}/rest/v1/admins?user_id=eq.${uid}&select=user_id`, {
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
  });
  const adminRows = adminRes.ok ? await adminRes.json() : [];
  if (!Array.isArray(adminRows) || adminRows.length === 0) return res.status(403).json({ error: "Forbidden — admins only." });

  // 2) Inputs.
  const body = req.body && typeof req.body === "object" ? req.body : (() => { try { return JSON.parse(req.body || "{}"); } catch { return {}; } })();
  if (!body.line1) return res.status(400).json({ error: "line1 (badge title) is required." });
  const slug = String(body.id || "badge").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const prompt = buildBadgePrompt(body);

  // 3) Generate (with model fallback).
  let r = await callGemini(DEFAULT_MODEL, GEMINI_API_KEY, prompt);
  if (!r.ok && (r.status === 404 || JSON.stringify(r.data).toLowerCase().includes("not found"))) {
    r = await callGemini(FALLBACK_MODEL, GEMINI_API_KEY, prompt);
  }
  if (!r.ok) return res.status(502).json({ error: (r.data && r.data.error && r.data.error.message) || "Image generation failed." });
  const images = extractImages(r.data);
  if (images.length === 0) return res.status(502).json({ error: "No image returned (possibly blocked by safety filters). Try adjusting the scene." });

  // 4) Upload PNG to Supabase Storage (service role) and return the public URL.
  const buffer = Buffer.from(images[0], "base64");
  const path = `${slug}-${Date.now().toString(36)}.png`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/badge-art/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE}`, apikey: SERVICE, "Content-Type": "image/png", "x-upsert": "true" },
    body: buffer,
  });
  if (!up.ok) {
    const t = await up.text().catch(() => "");
    return res.status(500).json({ error: "Saving the image failed: " + (t || up.status) });
  }
  const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/badge-art/${path}`;
  return res.status(200).json({ imageUrl, prompt });
};
