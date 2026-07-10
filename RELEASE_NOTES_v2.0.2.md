# Atlas v2.0.2 — Mobile Workflow + Backend Transcription

**Release type:** Feature (mobile transcription pathway) — **field verification pending**
**Depends on:** Cloudflare Worker v2 deploy + a Workers AI binding (below)

---

## 1. Selected Workers AI model

**`@cf/openai/whisper-large-v3-turbo`** (verified against current Cloudflare docs, July 2026).

Why this model: large-v3 accuracy handles noisy stadium audio and varied accents; the "turbo" variant keeps latency low for short/medium narratives; it is multilingual with a `language` parameter (auto-detect when omitted) for future non-English support; it accepts **base64 audio** (clean from a browser recording) and returns `{ text, word_count, segments[], vtt }`; and it exposes an **`initial_prompt`** parameter, which Atlas uses to bias recognition toward venue vocabulary (Ford Field, S.A.F.E., gate names, the current event name). Pricing is **$0.00051 per audio minute**; Workers AI includes a free daily allowance. Alternatives considered: `@cf/openai/whisper` (base; lower accuracy, byte-array input) and `@cf/deepgram/nova-3` (excellent, real-time, but a paid partner model) — turbo is the best accuracy/latency/cost fit for this use.

## 2. Exact binding name

**`AI`** — called in the Worker as **`env.AI`**. (This is the Cloudflare-standard Workers AI binding name and matches the model docs; no reason to deviate.)

## 3. Worker changes

`safe-ai-proxy-worker.js` is now **v2**. The v1 file is preserved as `safe-ai-proxy-worker.v1-backup.js`.
- **Text route unchanged.** `POST /` still forwards `{model, max_tokens, system, messages}` to Anthropic `/v1/messages` using the `ANTHROPIC_API_KEY` secret — byte-for-byte v1 behavior.
- **New transcription route.** `POST /transcribe` accepts `multipart/form-data` (`audio` file + `language`, `durationMs`, `fieldKey`, `vocabulary`), base64-encodes the audio in-Worker (chunked; no `nodejs_compat` needed), calls `env.AI.run("@cf/openai/whisper-large-v3-turbo", …)`, and returns normalized JSON.

Success: `{ ok:true, transcript, provider:"cloudflare-workers-ai", model, language, requestId, durationMs }`
Failure: `{ ok:false, errorCode, message, requestId }`

## 4. Frontend changes

`transcribeAudio({blob, mimeType, language, durationMs, fieldKey})` posts multipart to `/transcribe` (never sets `Content-Type` manually). On **Send Recording** with no browser transcript, Atlas uploads the saved audio, shows *Uploading → Transcribing → Preparing write-up*, then routes the returned transcript through the mounted field's existing editorial profile (incident/witness/recognition). Recording-duration lifecycle fixed (no more `00:00`). Helper text now states the audio is sent on Send. `TRANSCRIPTION_PROVIDER = cloudflare-workers-ai` when the endpoint is configured.

## 5. Security controls

Origin allowlist (`https://pbuchan3-pb3.github.io`; **no wildcard CORS**), POST/OPTIONS only, MIME allowlist, **20 MB** cap, empty-file rejection, per-request `requestId`, generic client-facing errors (no stack traces/secrets), **no audio persistence**, no keys in the browser or GitHub. The Anthropic key stays a Worker secret; the AI binding needs no key in code.

## 6. Test results (this environment)

Code-level only — `node --check` passes for both the app and the Worker; desktop `generatePDF`/`generateWord`/`parseName`/`cleanWithAI`/`recStartSpeech` are byte-identical; Anthropic text route preserved; no `sk-ant`; no wildcard CORS. **Runtime `/transcribe` + Android field tests require your deploy** (Cloudflare inference and Android hardware can't run here).

## 7. Cloudflare deployment instructions (Phase 18)

**A. Add the Workers AI binding**
1. Cloudflare dashboard → **Workers & Pages** → open **safe-ai-proxy**.
2. **Settings** → **Bindings** → **Add binding**.
3. Choose **Workers AI**.
4. **Variable name:** `AI` (exactly). Save.
5. Confirm the existing **`ANTHROPIC_API_KEY`** secret is still present (Settings → Variables and Secrets).

**B. Deploy the Worker code**
6. Open the Worker's **Edit code** (Quick edit).
7. Replace all contents with `safe-ai-proxy-worker.js` (v2 from this release).
8. **Deploy**.

*(Wrangler equivalent, if you use it instead of the dashboard — add to `wrangler.toml`:)*
```toml
[ai]
binding = "AI"
```
then `wrangler deploy`.

**C. Verify the text route still works**
9. In the app (desktop), run any narrative rewrite — it should still clean up normally (that's the unchanged `/` route).

**D. Test the transcription route**
10. `curl -X OPTIONS https://<your-worker>/transcribe -H "Origin: https://pbuchan3-pb3.github.io" -i` → expect `200` with the CORS header.
11. `curl -X POST https://<your-worker>/transcribe -H "Origin: https://pbuchan3-pb3.github.io" -F "audio=@sample.webm;type=audio/webm" -F "language=en" -i` → expect `{ ok:true, transcript:"…" }`.
12. Empty/invalid: `-F "audio=@empty"` → `EMPTY_AUDIO`; a `.txt` as audio → `UNSUPPORTED_MEDIA_TYPE`; a request without the approved `Origin` → `ORIGIN_NOT_ALLOWED`.
13. On Android: record 60 s → **Send Recording** → confirm a transcript returns, routes through the right writer, and the duration shows nonzero.

## 8. Remaining risks

- Whisper accuracy on very noisy crowd audio is good but not perfect — the supervisor still reviews/edits every rewrite (Principle 11 holds).
- Android `MediaRecorder` produces `audio/webm` (Opus) or `audio/mp4`; both are in the MIME allowlist and accepted by Whisper, but confirm your device's actual MIME in the `?debug=1` snapshot.
- Very long recordings could approach limits; the 20 MB cap ≈ several minutes of Opus. Chunking is a future enhancement if needed.
- The frontend pathway is **not yet field-verified end to end** — it cannot be until the Worker is deployed.

## 9. Rollback procedure

- **Worker:** paste `safe-ai-proxy-worker.v1-backup.js` back into the Worker and Deploy. (Text rewrite keeps working; `/transcribe` simply 404s/► the frontend falls back to "type instead" — audio is never lost.)
- **Frontend:** redeploy the previous `index.html` (v2.0.1). With no `/transcribe`, `TRANSCRIPTION_PROVIDER` still resolves but requests fail gracefully to the preserved-audio + type-instead path.
- The AI binding can be left in place; it is inert without the v2 code.

---

## Deferred to v2.0.2b (not in this release)

Protected-name confirmation (Phase 8 full), quick-dictation labeling (12), reassignment picker (13), floating-voice overlap (14), native PDF/Word file sharing (15), and Field Mode header collapse (16). These are frontend-only and independent of the transcription core; they will ship as a sequenced, checksum-verified follow-up **after** v2.0.2 passes Android field verification — bundling them blind with an untestable backend change would risk quality.
