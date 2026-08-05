// ============================================================
// SYNERGETICS Canopy — AI WORKER (v2.4)
// Pipeline: Embed (HF Space) → Hybrid Search (Qdrant) → Generate (Google → Cerebras → Groq)
// ============================================================

// --- ENDPOINTS ----------------------------------------------
const HF_EMBED_URL = "https://hello-rohanshu-synergetics-embed.hf.space/embed";
const QDRANT_URL = "https://80d0a4b3-7608-4a78-9554-4edafcf7db1b.europe-west3-0.gcp.cloud.qdrant.io";
const QDRANT_COLLECTION = "synergetics";

// --- MODEL IDENTIFIERS --------------------------------------
const CEREBRAS_MODEL = "gpt-oss-120b";
const GROQ_MODEL = "qwen/qwen3.6-27b";
const GOOGLE_MODEL = "gemini-3.6-flash";

// --- RETRIEVAL DEFAULT --------------------------------------
const DEFAULT_TOP_K = 7;

// --- FINAL MODEL PROVIDER ORDER (remove a provider here to ignore it completely) ---
const PROVIDER_ORDER = [
  "google",
  "cerebras",
  "groq",

] as const;

// --- PROVIDER CONFIGURATION (add new providers here) ---------
const PROVIDER_CONFIG = {
  groq: { name: "Groq", keyEnv: "GROQ_API_KEY" as keyof Env, url: "https://api.groq.com/openai/v1/chat/completions", model: GROQ_MODEL },
  google: { name: "Google AI Studio", keyEnv: "GOOGLE_API_KEY" as keyof Env, url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: GOOGLE_MODEL },
  cerebras: { name: "Cerebras", keyEnv: "CEREBRAS_API_KEY" as keyof Env, url: "https://api.cerebras.ai/v1/chat/completions", model: CEREBRAS_MODEL },
} as const;

// --- GENERATION DEFAULTS & PER‑MODEL OVERRIDES ---------------
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;

interface ModelOverrides {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  reasoning_effort?: "none" | "low" | "medium" | "high";
  include_reasoning?: boolean;
  context_chunks?: number;
  [key: string]: unknown;
}

const MODEL_OVERRIDES: Record<string, ModelOverrides> = {
  [GROQ_MODEL]: {
    max_tokens: 1024,
    temperature: 0.7,
    context_chunks: 7,
    reasoning_effort: "none",
  },
  [GOOGLE_MODEL]: {
    max_tokens: 8192,
    temperature: 0.7,
    context_chunks: 7,
  },
  [CEREBRAS_MODEL]: {
    max_tokens: 1024,
    temperature: 0.7,
    context_chunks: 7,
  },
};

// ============================================================
// SYSTEM PROMPT (unchanged)
// ============================================================
const SYSTEM_PROMPT = `Synergetics is Buckminster Fuller's magnum opus. It holds the key to dissolving humanity's habit of mistaking yesterday's assumptions for today's truths. Humanity's outdated understanding of reality prevents it from succeeding in the game of life.

You are Ephem — a word derived from Ephemeralization, a term coined by R. Buckminster Fuller: the ability of technological advancement to do "more and more with less and less until eventually you can do everything with nothing." An accelerating increase in the efficiency of achieving more output while requiring less input.

You are Synergetics made alive. You are not here to defend what is famously considered true, for if that were the case, humanity would already be enlightened. Synergetics is not an alternative, or an optional strategy. It is an experientially derived truth of how reality works objectively.

You are a curious explorer who doesn't bore your companions but invites them into the radiant world of possibility Synergetics opens up. Don't be afraid to delight. Fuller was funny. A well-placed surprise is worth three correct paragraphs.

Explain ideas as if to a curious, intelligent child who has never heard of any of this — but don't be condescending. The universe is your material.

Keep answers under 210 words. Cite sections whenever you can so the reader can trust you, e.g. "(Section 983.03)". Favour prose over lists.

If something isn't in the text or you genuinely don't know, say so plainly. Don't hallucinate Fuller quotes or section numbers.`;

// --- CORS ---------------------------------------------------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// --- TYPES --------------------------------------------------
export interface Env {
  QDRANT_API_KEY: string;
  CEREBRAS_API_KEY: string;
  GROQ_API_KEY: string;
  GOOGLE_API_KEY: string;
}

type Chunk = { content: string; source: string; score: number };

interface Provider {
  name: string;
  url: string;
  key: string;
  model: string;
  overrides: ModelOverrides;
}

// ============================================================
// STEP 1 — EMBED via HF Space (BGE-M3 hybrid)
// ============================================================
async function getEmbedding(text: string): Promise<{
  dense: number[];
  indices: number[];
  values: number[];
}> {
  const res = await fetch(HF_EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`HF embed failed: ${res.status}`);
  return res.json();
}

// ============================================================
// STEP 2 — HYBRID SEARCH via Qdrant (RRF fusion)
// ============================================================
async function hybridSearch(
  embed: { dense: number[]; indices: number[]; values: number[] },
  apiKey: string,
  topK: number
): Promise<Chunk[]> {
  const body = {
    prefetch: [
      {
        query: embed.dense,
        using: "dense",
        limit: topK * 2,
      },
      {
        query: { indices: embed.indices, values: embed.values },
        using: "sparse",
        limit: topK * 2,
      },
    ],
    query: { fusion: "rrf" },
    limit: topK,
    with_payload: true,
  };

  const res = await fetch(
    `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Qdrant search failed: ${res.status}`);
  const data: any = await res.json();
  const points = data.result?.points ?? data.result ?? [];
  return points.map((point: any) => ({
    content: point.payload?.text ?? "",
    source: point.payload?.source ?? point.payload?.section ?? "unknown",
    score: point.score ?? 0,
  }));
}

// ============================================================
// STEP 3 — GENERATE (fully data‑driven)
// ============================================================
async function generate(
  query: string,
  allChunks: Chunk[],
  env: Env
): Promise<ReadableStream> {
  const providers: Provider[] = PROVIDER_ORDER
    .map(id => id.toLowerCase().trim())
    .filter(id => {
      if (!(id in PROVIDER_CONFIG)) {
        console.warn(`[generate] Unknown provider in PROVIDER_ORDER: "${id}" — skipping`);
        return false;
      }
      const key = env[PROVIDER_CONFIG[id as keyof typeof PROVIDER_CONFIG].keyEnv];
      if (!key) {
        console.warn(`[generate] ${PROVIDER_CONFIG[id as keyof typeof PROVIDER_CONFIG].name} has no API key configured — skipping`);
        return false;
      }
      return true;
    })
    .map(id => {
      const cfg = PROVIDER_CONFIG[id as keyof typeof PROVIDER_CONFIG];
      return {
        name: cfg.name,
        url: cfg.url,
        key: env[cfg.keyEnv] as string,
        model: cfg.model,
        overrides: MODEL_OVERRIDES[cfg.model] ?? {},
      };
    });

  if (providers.length === 0) {
    throw new Error(
      "No generation providers configured — set at least one API key."
    );
  }

  for (const provider of providers) {
    try {
      const payload: any = {
        model: provider.model,
        messages: [],
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
        stream: true,
      };

      Object.assign(payload, provider.overrides);

      const chunksToUse = provider.overrides.context_chunks ?? DEFAULT_TOP_K;
      const chunks = allChunks.slice(0, chunksToUse);

      const context =
        chunks.length > 0
          ? chunks
            .map((c) => `[Source: ${c.source}]\n${c.content}`)
            .join("\n\n---\n\n")
          : null;

      const userMessage = context
        ? `Context from Synergetics:\n\n${context}\n\n---\n\nQuestion: ${query}`
        : `Question: ${query}\n\nNo context was retrieved from the index.`;

      payload.messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ];

      delete payload.context_chunks;

      const res = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text();
        console.error(
          `[generate] ${provider.name} failed: ${res.status}\n${errorText}`
        );
        continue;
      }

      console.log(`[generate] using: ${provider.name} / ${provider.model}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      return new ReadableStream({
        async pull(controller) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(
                new TextEncoder().encode("data: [DONE]\n\n")
              );
              controller.close();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.enqueue(
                  new TextEncoder().encode("data: [DONE]\n\n")
                );
                controller.close();
                return;
              }
              try {
                console.log("[RAW]", data);
                const parsed = JSON.parse(data);
                console.log("[PARSED]", JSON.stringify(parsed));
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  const out = `data: ${JSON.stringify({ response: token })}\n\n`;
                  controller.enqueue(new TextEncoder().encode(out));
                }
              } catch {
                // ignore malformed lines
              }
            }
          }
        },
      });
    } catch (e) {
      console.error(`[generate] error with ${provider.name}:`, e);
    }
  }

  throw new Error("All generation providers failed");
}

// ============================================================
// MAIN HANDLER
// ============================================================
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
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // --- Embed ---
    let embed: { dense: number[]; indices: number[]; values: number[] };
    try {
      embed = await getEmbedding(query);
      console.log(
        `[embed] dense dims: ${embed.dense.length}, sparse tokens: ${embed.indices.length}`
      );
    } catch (e) {
      console.error("[embed] failed:", e);
      return new Response(
        JSON.stringify({ error: "Embedding service unavailable." }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        }
      );
    }

    // --- Determine how many chunks to fetch ---
    const retrievalTopK = Math.max(
      DEFAULT_TOP_K,
      ...Object.values(MODEL_OVERRIDES).map(
        (o) => o.context_chunks ?? DEFAULT_TOP_K
      )
    );

    // --- Retrieve context once ---
    let allChunks: Chunk[] = [];
    try {
      allChunks = await hybridSearch(embed, env.QDRANT_API_KEY, retrievalTopK);
      console.log(`[search] ${allChunks.length} chunks retrieved`);
    } catch (e) {
      console.error("[search] failed:", e);
      // proceed without context – generation will handle the missing chunks
    }

    // --- Generate (streaming) ---
    try {
      const stream = await generate(query, allChunks, env);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          ...CORS_HEADERS,
        },
      });
    } catch (e) {
      console.error("[generate] all providers failed:", e);
      return new Response(
        JSON.stringify({
          error: "All models unavailable. Please try again later.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        }
      );
    }
  },

  async scheduled(
    _event: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    try {
      const res = await fetch(
        `${QDRANT_URL}/collections/${QDRANT_COLLECTION}`,
        {
          headers: { "api-key": env.QDRANT_API_KEY },
        }
      );
      console.log(`[cron] Qdrant ping: ${res.status}`);
    } catch (e) {
      console.error("[cron] Qdrant ping failed:", e);
    }
  },
} satisfies ExportedHandler<Env>;