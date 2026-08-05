// ============================================================
// SYNERGETICS Canopy — AI WORKER (v2.5, modularized)
// Pipeline: Embed (HF Space) → Hybrid Search (Qdrant) → Generate
//
// File map:
//   providers.ts  — EDIT THIS to add/change/remove a model or provider
//   generate.ts   — resolves providers.ts + streams the LLM response
//   retrieval.ts  — embedding + Qdrant hybrid search
//   index.ts      — (this file) HTTP handling only, wires the above together
// ============================================================

import type { Env } from "./providers";
import { generate, maxContextChunks } from "./generate";
import { getEmbedding, hybridSearch, pingQdrant, type Embedding } from "./retrieval";
import type { Chunk } from "./generate";

export type { Env };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ping") {
      return new Response("ok", { status: 200 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let query: string;
    try {
      const body = (await request.json()) as { query?: string };
      query = body.query?.trim() ?? "";
      if (!query) throw new Error("Empty query");
    } catch {
      return jsonError("Invalid request body", 400);
    }

    // --- Embed ---
    let embed: Embedding;
    try {
      embed = await getEmbedding(query);
      console.log(`[embed] dense dims: ${embed.dense.length}, sparse tokens: ${embed.indices.length}`);
    } catch (e) {
      console.error("[embed] failed:", e);
      return jsonError("Embedding service unavailable.", 503);
    }

    // --- Retrieve (fetch enough chunks for whichever configured model wants the most) ---
    let allChunks: Chunk[] = [];
    try {
      allChunks = await hybridSearch(embed, env.QDRANT_API_KEY, maxContextChunks());
      console.log(`[search] ${allChunks.length} chunks retrieved`);
    } catch (e) {
      console.error("[search] failed:", e);
      // proceed without context – generation will handle the missing chunks
    }

    // --- Generate (streaming, tries providers in PROVIDER_ORDER) ---
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

  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      const status = await pingQdrant(env.QDRANT_API_KEY);
      console.log(`[cron] Qdrant ping: ${status}`);
    } catch (e) {
      console.error("[cron] Qdrant ping failed:", e);
    }
  },
} satisfies ExportedHandler<Env>;
