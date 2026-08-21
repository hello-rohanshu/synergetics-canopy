// ============================================================
// PROVIDERS — the only file you need to edit to add/change a model
// ============================================================
//
// HOW TO ADD A NEW PROVIDER:
//   1. Copy any block below (the { ... } between two commas).
//   2. Change: key, name, url, keyEnv, model.
//   3. Add the same `key` string to PROVIDER_ORDER at the bottom.
//   4. Add the matching secret in Cloudflare: wrangler secret put YOUR_KEY_ENV
//   That's it. Nothing else in this file, or any other file, needs to change.
//
// HOW TO CHANGE A MODEL'S BEHAVIOR (speed, length, creativity):
//   Just edit the numbers inside that provider's block. See the "What these
//   do" cheat-sheet below the list if you're not sure what a field means.
//
// HOW TO TEMPORARILY DISABLE A PROVIDER:
//   Remove its `key` from PROVIDER_ORDER at the bottom — no need to delete
//   the block, it'll just be ignored.
//
// ============================================================

export interface Env {
  HF_API_KEY: string;
  QDRANT_API_KEY: string;
  CEREBRAS_API_KEY: string;
  GROQ_API_KEY: string;
  GOOGLE_API_KEY: string;
  MISTRAL_API_KEY: string;
  OLLAMA_API_KEY: string; // only has paid models apparently, removed for now
  // Add a new line here matching the keyEnv of any provider you add below.
}

export interface ProviderDefinition {
  /** Short internal id — must match an entry in PROVIDER_ORDER. Lowercase, no spaces. */
  key: string;
  /** Human-readable name, shown in logs. */
  name: string;
  /** Chat-completions endpoint (OpenAI-compatible). */
  url: string;
  /** Name of the secret in Env that holds this provider's API key. */
  keyEnv: keyof Env;
  /** Exact model identifier the provider expects. */
  model: string;
  /** How many retrieved chunks to feed this model as context. */
  contextChunks?: number;
  /** Any other body fields this model wants (temperature, max_tokens, etc). */
  params?: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    reasoning_effort?: "none" | "low" | "medium" | "high";
    include_reasoning?: boolean;
    [key: string]: unknown;
  };
}

// ============================================================
// THE PROVIDER LIST — add / remove / edit blocks freely
// ============================================================
export const PROVIDERS: ProviderDefinition[] = [
  {
    key: "google",
    name: "Google AI Studio",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyEnv: "GOOGLE_API_KEY",
    model: "gemini-3.6-flash",
    contextChunks: 7,
    params: {
      max_tokens: 8192,
      temperature: 0.7,
    },
  },
  {
    key: "cerebras",
    name: "Cerebras",
    url: "https://api.cerebras.ai/v1/chat/completions",
    keyEnv: "CEREBRAS_API_KEY",
    model: "gpt-oss-120b",
    contextChunks: 7,
    params: {
      max_tokens: 1024,
      temperature: 0.7,
    },
  },
  {
    key: "groq",
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyEnv: "GROQ_API_KEY",
    model: "qwen/qwen3.6-27b",
    contextChunks: 7,
    params: {
      max_tokens: 1024,
      temperature: 0.7,
      reasoning_effort: "none",
    },
  },
  {
    key: "mistral",
    name: "Mistral",
    url: "https://api.mistral.ai/v1/chat/completions",
    keyEnv: "MISTRAL_API_KEY",
    model: "open-mixtral-8x7b",
    contextChunks: 7,
    params: {
      max_tokens: 1024,
      temperature: 0.7,
    },
  },
];

// ============================================================
// PROVIDER ORDER — fallback order, first to last.
// To disable a provider without deleting it, just remove it from here.
// ============================================================
export const PROVIDER_ORDER: string[] = [
  "google",
  "cerebras",
  "groq",
  "mistral",
];

// ============================================================
// "What these fields do" cheat-sheet
// ------------------------------------------------------------
// max_tokens        — longest possible reply, in tokens (~¾ word each)
// temperature        — 0 = predictable/focused, 1+ = more random/creative
// contextChunks       — how many retrieved passages to hand the model
// reasoning_effort    — "none"/"low"/"medium"/"high", only for models
//                       that support extended thinking; skip if unsupported
// ============================================================
