// Glowe Play — badge image generator (Supabase Edge Function)
// Mirrors the Mom Ops mockup route: admin-gated, fixed style rules, Google Gemini
// native image generation, result uploaded to the `badge-art` Storage bucket.
//
// Deploy:
//   supabase functions deploy generate-badge
//   supabase secrets set GEMINI_API_KEY=xxxxx        (from https://aistudio.google.com/app/api-keys)
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";
const FALLBACK_MODEL = "gemini-2.0-flash-exp";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Brand palette so every badge comes out in the Glowe Play style.
const PALETTE =
  "Colors: deep navy #243B6B, sky teal #4EA8DE, sunshine gold #F4C542, adventure red #F25F5C, leaf green #5CB85C, warm cream #FFF8F0.";

function accentName(type: string, accent: string) {
  if (accent && accent !== "auto" && accent.startsWith("#")) return `the color ${accent}`;
  if (type === "milestone") return "gold";
  if (type === "tradition") return "red";
  return "teal";
}

function buildBadgePrompt(input: Record<string, string>) {
  const { line1, line2, type, description, scene_prompt } = input;
  const accent = accentName(type, input.accent || "auto");
  const scene = scene_prompt || `a friendly flat-illustration scene about "${line1} ${line2}"`;
  return `Create a single circular achievement badge sticker, flat vector illustration, centered on a plain off-white background. Square image.
The badge is a perfect circle with a thick ${accent} outer ring and a clean white sticker border with a soft drop shadow.
Top ~55%: a flat-illustration night scene — ${scene} — set against a deep navy sky with a few small stars and a crescent moon. A small circular ${accent} camera icon chip overlaps the badge at the top-left edge.
Bottom ~45%: a white panel. Show the title on two lines — "${line1}" in bold navy uppercase, and "${line2}" in ${accent} uppercase beneath it — then a thin divider, then the caption "${description}" in small navy text.
Along the very bottom, a curved ${accent} banner reads "ADVENTURE COMPLETED!" with a white check-mark circle flanked by two small gold stars.
Style: modern children's-brand, cheerful, rounded, high detail, crisp flat colors, no gradients-heavy realism, no photographic elements. Spell all text exactly and correctly. ${PALETTE}`;
}

function extractImages(resp: any): string[] {
  const out: string[] = [];
  const parts = resp?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) for (const p of parts) if (p?.inlineData?.data) out.push(p.inlineData.data);
  return out;
}

async function callGemini(model: string, apiKey: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "GEMINI_API_KEY is not set. Run: supabase secrets set GEMINI_API_KEY=…" }, 503);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 1) Identify the caller and confirm they are an admin.
  const authHeader = req.headers.get("Authorization") ?? "";
  const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: userData } = await asUser.auth.getUser();
  const user = userData?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE);
  const { data: adminRow } = await admin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return json({ error: "Forbidden — admins only." }, 403);

  // 2) Read inputs.
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body." }, 400); }
  const slug = (body.id || "badge").toString().replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  if (!body.line1) return json({ error: "line1 (badge title) is required." }, 400);

  const prompt = buildBadgePrompt(body);

  // 3) Generate (with model fallback).
  let r = await callGemini(DEFAULT_MODEL, apiKey, prompt);
  if (!r.ok && (r.status === 404 || JSON.stringify(r.data).toLowerCase().includes("not found"))) {
    r = await callGemini(FALLBACK_MODEL, apiKey, prompt);
  }
  if (!r.ok) {
    const msg = r.data?.error?.message || "Image generation failed.";
    return json({ error: msg }, 502);
  }
  const images = extractImages(r.data);
  if (images.length === 0) return json({ error: "No image returned (possibly blocked by safety filters). Try adjusting the scene." }, 502);

  // 4) Upload PNG to Storage and return the public URL.
  const bytes = Uint8Array.from(atob(images[0]), (c) => c.charCodeAt(0));
  const path = `${slug}-${crypto.randomUUID().slice(0, 8)}.png`;
  const up = await admin.storage.from("badge-art").upload(path, bytes, { contentType: "image/png", upsert: true });
  if (up.error) return json({ error: "Uploaded image failed to save: " + up.error.message }, 500);
  const { data: pub } = admin.storage.from("badge-art").getPublicUrl(path);

  return json({ imageUrl: pub.publicUrl, prompt });
});
