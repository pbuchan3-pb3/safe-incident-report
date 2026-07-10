/**
 * SAFE AI Proxy — Cloudflare Worker (v2)
 * ---------------------------------------------------------------------------
 * TWO server-side pathways, one Worker. The browser never sees any key.
 *
 *   1. Text rewrite (UNCHANGED from v1):
 *        POST  /            JSON  ->  Anthropic /v1/messages
 *      Requires secret:  ANTHROPIC_API_KEY
 *
 *   2. Speech-to-text (NEW):
 *        POST  /transcribe  multipart/form-data (audio) -> Workers AI (Whisper)
 *      Requires binding:  AI   (Workers AI)  ->  env.AI
 *      Model:  @cf/openai/whisper-large-v3-turbo
 *
 * The root "/" behavior is byte-for-byte the v1 text proxy so the existing
 * editorial-rewrite pathway cannot regress. Transcription is fully additive.
 *
 * Deploy / bindings: see RELEASE_NOTES_v2.0.2.md (Phase 18 instructions).
 * Rollback: redeploy safe-ai-proxy-worker.v1-backup.js.
 * ---------------------------------------------------------------------------
 */

const ALLOW_ORIGINS = [
  "https://pbuchan3-pb3.github.io", // GitHub Pages production origin
];

// Transcription limits (Phase 4 security controls)
const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB hard cap
const ALLOWED_AUDIO_MIME = [
  "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/mp3",
  "audio/wav", "audio/x-wav", "audio/aac", "audio/3gpp", "audio/amr",
];
const STT_MODEL = "@cf/openai/whisper-large-v3-turbo";

function pickOrigin(request) {
  const o = request.headers.get("Origin") || "";
  return ALLOW_ORIGINS.includes(o) ? o : "";
}
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || ALLOW_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
function reqId() {
  return (crypto && crypto.randomUUID) ? crypto.randomUUID()
    : "req_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Base64-encode an ArrayBuffer in chunks (no Buffer / no nodejs_compat needed).
function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export default {
  async fetch(request, env) {
    const origin = pickOrigin(request);
    const cors = corsHeaders(origin);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // Preflight (Phase 3.3 / 4)
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // Strict origin allowlist for non-preflight requests (Phase 4).
    // (An empty Origin is allowed only when the browser sent no Origin header;
    //  browsers always send Origin for cross-origin fetches.)
    const originOk = origin !== "" || request.headers.get("Origin") === null;

    // ---------------------------------------------------------------------
    // ROUTE: /transcribe  (NEW — Workers AI speech-to-text)
    // ---------------------------------------------------------------------
    if (path === "/transcribe") {
      const id = reqId();
      if (request.method !== "POST")
        return json({ ok: false, errorCode: "METHOD_NOT_ALLOWED", message: "Use POST.", requestId: id }, 405, cors);
      if (!originOk)
        return json({ ok: false, errorCode: "ORIGIN_NOT_ALLOWED", message: "Origin not allowed.", requestId: id }, 403, cors);
      if (!env.AI)
        return json({ ok: false, errorCode: "TRANSCRIPTION_UNCONFIGURED", message: "Transcription is not configured.", requestId: id }, 503, cors);

      let form;
      try { form = await request.formData(); }
      catch { return json({ ok: false, errorCode: "BAD_REQUEST", message: "Expected multipart/form-data.", requestId: id }, 400, cors); }

      const file = form.get("audio");
      if (!file || typeof file === "string")
        return json({ ok: false, errorCode: "NO_AUDIO", message: "No audio was provided.", requestId: id }, 400, cors);

      const mime = (file.type || "").toLowerCase().split(";")[0];
      if (mime && !ALLOWED_AUDIO_MIME.includes(mime))
        return json({ ok: false, errorCode: "UNSUPPORTED_MEDIA_TYPE", message: "Unsupported audio format.", requestId: id }, 415, cors);

      const buf = await file.arrayBuffer();
      if (!buf || buf.byteLength === 0)
        return json({ ok: false, errorCode: "EMPTY_AUDIO", message: "The audio file was empty.", requestId: id }, 400, cors);
      if (buf.byteLength > MAX_AUDIO_BYTES)
        return json({ ok: false, errorCode: "AUDIO_TOO_LARGE", message: "The recording is too large to transcribe.", requestId: id }, 413, cors);

      const language = (form.get("language") || "en").toString().slice(0, 8);
      const durationMs = parseInt(form.get("durationMs") || "0", 10) || 0;
      const initialPrompt = (form.get("vocabulary") || "").toString().slice(0, 900);

      let out;
      try {
        const base64 = toBase64(buf);
        const input = { audio: base64, task: "transcribe", vad_filter: true };
        if (language && language !== "auto") input.language = language;
        if (initialPrompt) input.initial_prompt = initialPrompt;
        out = await env.AI.run(STT_MODEL, input);
      } catch (e) {
        // Never expose stack traces or internal config (Phase 4).
        return json({ ok: false, errorCode: "TRANSCRIPTION_FAILED", message: "Atlas could not transcribe this recording.", requestId: id }, 502, cors);
      }

      const transcript = (out && (out.text || out.transcript) || "").trim();
      if (!transcript)
        return json({ ok: false, errorCode: "NO_SPEECH", message: "No speech was detected in the recording.", requestId: id }, 200, cors);

      // Audio is not persisted; only the transcript is returned (Phase 4).
      return json({
        ok: true,
        transcript,
        provider: "cloudflare-workers-ai",
        model: STT_MODEL,
        language,
        requestId: id,
        durationMs,
      }, 200, cors);
    }

    // ---------------------------------------------------------------------
    // ROUTE: /  (UNCHANGED — Anthropic text rewrite, v1 behavior preserved)
    // ---------------------------------------------------------------------
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405, headers: cors });

    let payload;
    try { payload = await request.json(); }
    catch { return json({ error: { message: "Invalid JSON" } }, 400, cors); }

    const body = {
      model: payload.model || "claude-sonnet-4-6",
      max_tokens: Math.min(payload.max_tokens || 300, 1024),
      system: payload.system,
      messages: payload.messages,
    };

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
