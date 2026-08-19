// ============================================================
// SYNERGETICS Canopy — AI WORKER (v3.0, unified)
//
// This is ONE worker that does THREE things:
//   1. Serves user queries  (POST /)
//   2. Keeps HF Space awake (cron: every minute)
//   3. Keeps Qdrant awake   (cron: every 2 hours)
//
// It also exposes health-check URLs so UptimeRobot and the
// Canopy dashboard can see if each service is actually alive.
//
// File map:
//   providers.ts — add/change/remove LLM providers here
//   generate.ts  — resolves providers + streams the LLM response
//   retrieval.ts — embedding + Qdrant hybrid search
//   index.ts     — (this file) HTTP routing + cron scheduling
// ============================================================

import type { Env } from "./providers";
import { generate, maxContextChunks } from "./generate";
import { getEmbedding, hybridSearch, type Embedding } from "./retrieval";
import type { Chunk } from "./generate";
import { QDRANT_URL } from "./retrieval";

export type { Env };

// ── Constants ────────────────────────────────────────────────

// The HuggingFace Space that runs our BGE-M3 embedding model.
// On the free tier it sleeps randomly — we wake it every minute.
const HF_SPACE = "hello-rohanshu/synergetics-embed";
const HF_HEALTH_URL = "https://hello-rohanshu-synergetics-embed.hf.space/health";

// ── CORS headers ─────────────────────────────────────────────
// These let the Canopy website (a different domain) talk to this worker.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Helpers ──────────────────────────────────────────────────

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ── HF Space keep-alive ──────────────────────────────────────
// Calls HF's restart API, then checks if /health responds.
// Returns what happened so the caller can log or return it.

async function keepAliveHF(hfToken: string): Promise<{
  ok: boolean;
  action: "was_running" | "woke_up" | "error";
  detail: string;
}> {
  try {
    // Tell HF to restart the Space.
    // 200 = was already running, 202 = was sleeping and is now booting.
    const restartRes = await fetch(
      `https://huggingface.co/api/spaces/${HF_SPACE}/restart`,
      { method: "POST", headers: { Authorization: `Bearer ${hfToken}` } }
    );

    const wasSleeping = restartRes.status === 202;
    console.log(`[hf] restart status: ${restartRes.status}`);

    // If it was sleeping, give it 30 seconds to boot before health-checking.
    if (wasSleeping) {
      console.log("[hf] Space was sleeping — waiting 30s for boot...");
      await new Promise(r => setTimeout(r, 30_000));
    }

    // Check that the Space actually responds now.
    const healthRes = await fetch(HF_HEALTH_URL);
    const body = await healthRes.text();
    console.log(`[hf] health: ${healthRes.status} — ${body}`);

    if (!healthRes.ok) {
      return { ok: false, action: "error", detail: `health returned ${healthRes.status}: ${body}` };
    }

    return {
      ok: true,
      action: wasSleeping ? "woke_up" : "was_running",
      detail: body,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[hf] keep-alive failed:", msg);
    return { ok: false, action: "error", detail: msg };
  }
}

// ── Qdrant keep-alive ────────────────────────────────────────
// A simple health ping. Qdrant free clusters suspend after 1 week
// of inactivity and DELETE after 4 weeks — so we ping every 2 hours.

async function keepAliveQdrant(apiKey: string): Promise<{
  ok: boolean;
  detail: string;
}> {
  try {
    const res = await fetch(`${QDRANT_URL}/healthz`, {
      headers: { "api-key": apiKey },
    });
    const body = await res.text();
    console.log(`[qdrant] health: ${res.status} — ${body}`);

    if (!res.ok) {
      return { ok: false, detail: `${res.status}: ${body}` };
    }
    return { ok: true, detail: body };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[qdrant] ping failed:", msg);
    return { ok: false, detail: msg };
  }
}

// ============================================================
// MAIN WORKER EXPORT
// ============================================================

export default {

  // ── HTTP handler ───────────────────────────────────────────
  // Handles all incoming HTTP requests.
  // Routes:
  //   GET  /ping         → combined health (HF + Qdrant). UptimeRobot watches this.
  //   GET  /ping/hf      → HF Space health only
  //   GET  /ping/qdrant  → Qdrant health only
  //   POST /             → RAG query (embed → search → generate)

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight (browser sends this before a real POST)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ── GET /ping ──────────────────────────────────────────
    // Checks both HF and Qdrant simultaneously.
    // Returns 200 if both are healthy, 503 if either is down.
    // This is the ONE URL UptimeRobot should watch.
    if (request.method === "GET" && url.pathname === "/ping") {
      const [hf, qdrant] = await Promise.all([
        keepAliveHF(env.HF_API_KEY),
        keepAliveQdrant(env.QDRANT_API_KEY),
      ]);
      const allOk = hf.ok && qdrant.ok;
      const status = allOk ? 200 : 503;
      return new Response(JSON.stringify({ hf, qdrant }, null, 2), {
        status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ── GET /ping/hf ───────────────────────────────────────
    // Checks if the HF Space is alive — no restart, just a knock.
    // The cron job (every minute) handles restarts.
    // Use this for the Canopy dashboard dot or debugging HF specifically.
    if (request.method === "GET" && url.pathname === "/ping/hf") {
      try {
        const res = await fetch(HF_HEALTH_URL);
        const body = await res.text();
        return new Response(JSON.stringify({ ok: res.ok, detail: body }, null, 2), {
          status: res.ok ? 200 : 503,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return new Response(JSON.stringify({ ok: false, detail: msg }, null, 2), {
          status: 503,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }
    }

    // ── GET /ping/qdrant ───────────────────────────────────
    // Checks only Qdrant.
    // Qdrant can't be pinged from the outside without going through this worker
    // because the API key can't be exposed to the browser.
    if (request.method === "GET" && url.pathname === "/ping/qdrant") {
      const result = await keepAliveQdrant(env.QDRANT_API_KEY);
      return new Response(JSON.stringify(result, null, 2), {
        status: result.ok ? 200 : 503,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ── GET /ping/worker ─────────────────────────────────────
    // Lightweight check — confirms the worker itself is running,
    // no external dependencies.
    if (request.method === "GET" && url.pathname === "/ping/worker") {
      return jsonOk({ status: "ok", timestamp: Date.now() });
    }

    // ── POST / — RAG pipeline ──────────────────────────────
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Parse the query from the request body
    let query: string;
    try {
      const body = (await request.json()) as { query?: string };
      query = body.query?.trim() ?? "";
      if (!query) throw new Error("Empty query");
    } catch {
      return jsonError("Invalid request body", 400);
    }

    // --- Embed ---
    // Turn the query into vectors (dense + sparse) using the HF Space.
    // If the Space is asleep, wake it and retry once — user waits ~30s
    // but gets an answer instead of a hard error.
    let embed: Embedding;
    try {
      embed = await getEmbedding(query);
      console.log(`[embed] dense dims: ${embed.dense.length}, sparse tokens: ${embed.indices.length}`);
    } catch (e) {
      console.warn("[embed] first attempt failed — waking HF Space and retrying...");
      await keepAliveHF(env.HF_API_KEY);
      try {
        embed = await getEmbedding(query);
        console.log(`[embed] retry succeeded — dense dims: ${embed.dense.length}`);
      } catch (e2) {
        console.error("[embed] retry also failed:", e2);
        return jsonError("Embedding service unavailable.", 503);
      }
    }

    // --- Retrieve ---
    // Search Qdrant for the most relevant Synergetics chunks
    let allChunks: Chunk[] = [];
    try {
      allChunks = await hybridSearch(embed, env.QDRANT_API_KEY, maxContextChunks());
      console.log(`[search] ${allChunks.length} chunks retrieved`);
    } catch (e) {
      console.error("[search] failed:", e);
      // Don't hard-fail — generate() can still respond without context
    }

    // --- Generate ---
    // Stream the LLM response, trying providers in PROVIDER_ORDER
    try {
      const stream = await generate(query, allChunks, env);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          ...CORS_HEADERS,
        },
      });
    } catch (e) {
      console.error("[generate] all providers failed:", e);
      return jsonError("All models unavailable. Please try again later.", 503);
    }
  },

  // ── Cron handler ───────────────────────────────────────────
  // Cloudflare calls this automatically on the schedules in wrangler.toml.
  // controller.cron tells us which schedule fired.

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    switch (controller.cron) {

      // Every minute: wake the HF Space before it fully sleeps
      case "* * * * *":
        ctx.waitUntil(
          keepAliveHF(env.HF_API_KEY).then(r => {
            if (!r.ok) console.error("[cron/hf] unhealthy:", r.detail);
            else console.log(`[cron/hf] ${r.action}`);
          })
        );
        break;

      // Every 2 hours: ping Qdrant so it doesn't suspend
      case "0 */2 * * *":
        ctx.waitUntil(
          keepAliveQdrant(env.QDRANT_API_KEY).then(r => {
            if (!r.ok) console.error("[cron/qdrant] unhealthy:", r.detail);
            else console.log(`[cron/qdrant] ok`);
          })
        );
        break;

      default:
        console.warn(`[cron] unhandled schedule: ${controller.cron}`);
    }
  },

} satisfies ExportedHandler<Env>;