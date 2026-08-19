// ============================================================
// RETRIEVAL — Embed (HF Space) → Hybrid Search (Qdrant, RRF fusion)
// ============================================================

import type { Chunk } from "./generate";

const HF_EMBED_URL = "https://hello-rohanshu-synergetics-embed.hf.space/embed";
export const QDRANT_URL = "https://80d0a4b3-7608-4a78-9554-4edafcf7db1b.europe-west3-0.gcp.cloud.qdrant.io";
const QDRANT_COLLECTION = "synergetics";

export type Embedding = { dense: number[]; indices: number[]; values: number[] };

export async function getEmbedding(text: string): Promise<Embedding> {
  const res = await fetch(HF_EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`HF embed failed: ${res.status}`);
  return res.json();
}

export async function hybridSearch(embed: Embedding, apiKey: string, topK: number): Promise<Chunk[]> {
  const body = {
    prefetch: [
      { query: embed.dense, using: "dense", limit: topK * 2 },
      { query: { indices: embed.indices, values: embed.values }, using: "sparse", limit: topK * 2 },
    ],
    query: { fusion: "rrf" },
    limit: topK,
    with_payload: true,
  };

  const res = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Qdrant search failed: ${res.status}`);
  const data: any = await res.json();
  const points = data.result?.points ?? data.result ?? [];
  return points.map((point: any) => ({
    content: point.payload?.text ?? "",
    source: point.payload?.source ?? point.payload?.section ?? "unknown",
    score: point.score ?? 0,
  }));
}