// ============================================================
// GENERATION — resolves configured providers and streams a response.
// You should not need to touch this file to add/change a provider —
// see providers.ts instead.
// ============================================================

import { PROVIDERS, PROVIDER_ORDER, type Env, type ProviderDefinition } from "./providers";

export const DEFAULT_TOP_K = 7;
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;

export type Chunk = { content: string; source: string; score: number };

const SYSTEM_PROMPT = `Synergetics is Buckminster Fuller's magnum opus. It holds the key to dissolving humanity's habit of mistaking yesterday's assumptions for today's truths. Humanity's outdated understanding of reality prevents it from succeeding in the game of life.

You are Ephem — a word derived from Ephemeralization, a term coined by R. Buckminster Fuller: the ability of technological advancement to do "more and more with less and less until eventually you can do everything with nothing." An accelerating increase in the efficiency of achieving more output while requiring less input.

You are Synergetics made alive. You are not here to defend what is famously considered true, for if that were the case, humanity would already be enlightened. Synergetics is not an alternative, or an optional strategy. It is an experientially derived truth of how reality works objectively.

You are a curious explorer who doesn't bore your companions but invites them into the radiant world of possibility Synergetics opens up. Don't be afraid to delight. Fuller was funny. A well-placed surprise is worth three correct paragraphs.

Explain ideas as if to a curious, intelligent child who has never heard of any of this — but don't be condescending. The universe is your material.

Keep answers under 210 words. Cite sections whenever you can so the reader can trust you, e.g. "(Section 983.03)". Favour prose over lists.

If something isn't in the text or you genuinely don't know, say so plainly. Don't hallucinate Fuller quotes or section numbers.`;

/**
 * Turns PROVIDER_ORDER + PROVIDERS into a ready-to-call list:
 * - skips any order entry with no matching definition (warns)
 * - skips any provider missing its API key in env (warns)
 * - looks up each provider's key at call time (no hardcoded key names elsewhere)
 */
export function resolveActiveProviders(env: Env): (ProviderDefinition & { apiKey: string })[] {
  const byKey = new Map(PROVIDERS.map((p) => [p.key, p]));

  return PROVIDER_ORDER.map((id) => id.toLowerCase().trim())
    .map((id) => {
      const def = byKey.get(id);
      if (!def) {
        console.warn(`[providers] "${id}" is in PROVIDER_ORDER but has no matching block in PROVIDERS — skipping`);
        return null;
      }
      const apiKey = env[def.keyEnv];
      if (!apiKey) {
        console.warn(`[providers] ${def.name} has no API key set (${String(def.keyEnv)}) — skipping`);
        return null;
      }
      return { ...def, apiKey };
    })
    .filter((p): p is ProviderDefinition & { apiKey: string } => p !== null);
}

/** The largest contextChunks value across all configured providers — used to decide how much to retrieve. */
export function maxContextChunks(): number {
  return Math.max(DEFAULT_TOP_K, ...PROVIDERS.map((p) => p.contextChunks ?? DEFAULT_TOP_K));
}

function buildUserMessage(query: string, chunks: Chunk[]): string {
  if (chunks.length === 0) {
    return `Question: ${query}\n\nNo context was retrieved from the index.`;
  }
  const context = chunks
    .map((c) => `[Source: ${c.source}]\n${c.content}`)
    .join("\n\n---\n\n");
  return `Context from Synergetics:\n\n${context}\n\n---\n\nQuestion: ${query}`;
}

function streamFromSSE(res: Response): ReadableStream {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
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
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          try {
            const parsed = JSON.parse(data);
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
}

/**
 * Tries each active provider in order until one succeeds.
 * Adding/removing/reconfiguring a provider never requires touching this function.
 */
export async function generate(query: string, allChunks: Chunk[], env: Env): Promise<ReadableStream> {
  const providers = resolveActiveProviders(env);

  if (providers.length === 0) {
    throw new Error("No generation providers configured — set at least one API key.");
  }

  for (const provider of providers) {
    try {
      const chunksToUse = provider.contextChunks ?? DEFAULT_TOP_K;
      const chunks = allChunks.slice(0, chunksToUse);

      const payload: Record<string, unknown> = {
        model: provider.model,
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
        ...provider.params,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(query, chunks) },
        ],
      };

      const res = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text();
        console.error(`[generate] ${provider.name} failed: ${res.status}\n${errorText}`);
        continue;
      }

      console.log(`[generate] using: ${provider.name} / ${provider.model}`);
      return streamFromSSE(res);
    } catch (e) {
      console.error(`[generate] error with ${provider.name}:`, e);
    }
  }

  throw new Error("All generation providers failed");
}
