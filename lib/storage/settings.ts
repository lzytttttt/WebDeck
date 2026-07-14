import { getDb } from "./db";

/**
 * Key/value settings store backed by the SQLite `settings` table.
 *
 * Used to persist user-chosen AI provider configuration (selected provider,
 * API keys, base URLs) so the choice survives restarts and is applied by the
 * generate pipeline without relying solely on environment variables.
 */

export type AIProviderId = "anthropic" | "openai" | "ollama" | "mock";

export type AISettings = {
  provider: AIProviderId;
  anthropicKey: string;
  openaiKey: string;
  openaiModel: string;
  ollamaUrl: string;
};

const KEYS: Record<keyof AISettings, string> = {
  provider: "ai_provider",
  anthropicKey: "ai_anthropic_key",
  openaiKey: "ai_openai_key",
  openaiModel: "ai_openai_model",
  ollamaUrl: "ai_ollama_url",
};

/** Read a single setting; returns undefined when unset. */
export function getSetting(key: string): string | undefined {
  try {
    const db = getDb();
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row?.value;
  } catch {
    // DB not initialized yet (e.g. pure test env) — treat as unset.
    return undefined;
  }
}

/** Write or replace a single setting. */
export function setSetting(key: string, value: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, value, now);
}

const VALID_PROVIDERS: AIProviderId[] = ["anthropic", "openai", "ollama", "mock"];

/**
 * Resolve the effective AI configuration: user-saved settings win, with
 * environment variables as the fallback for anything not explicitly set.
 */
export function getAIConfig(): AISettings {
  const savedProvider = getSetting(KEYS.provider);
  const envProvider = (process.env.AI_PROVIDER || "").trim().toLowerCase();

  const provider: AIProviderId = (
    savedProvider && VALID_PROVIDERS.includes(savedProvider as AIProviderId)
      ? savedProvider
      : VALID_PROVIDERS.includes(envProvider as AIProviderId)
        ? envProvider
        : process.env.ANTHROPIC_API_KEY
          ? "anthropic"
          : process.env.OPENAI_API_KEY
            ? "openai"
            : "mock"
  ) as AIProviderId;

  return {
    provider,
    anthropicKey: getSetting(KEYS.anthropicKey) || process.env.ANTHROPIC_API_KEY || "",
    openaiKey: getSetting(KEYS.openaiKey) || process.env.OPENAI_API_KEY || "",
    openaiModel: getSetting(KEYS.openaiModel) || process.env.OPENAI_MODEL || "",
    ollamaUrl: getSetting(KEYS.ollamaUrl) || process.env.OLLAMA_BASE_URL || "",
  };
}

/** Persist the user-chosen AI configuration. */
export function setAIConfig(cfg: Partial<AISettings>): AISettings {
  if (cfg.provider !== undefined) {
    const p = cfg.provider;
    if (!VALID_PROVIDERS.includes(p)) {
      throw new Error(`Unknown AI provider: ${p}`);
    }
    setSetting(KEYS.provider, p);
  }
  if (cfg.anthropicKey !== undefined) setSetting(KEYS.anthropicKey, cfg.anthropicKey);
  if (cfg.openaiKey !== undefined) setSetting(KEYS.openaiKey, cfg.openaiKey);
  if (cfg.openaiModel !== undefined) setSetting(KEYS.openaiModel, cfg.openaiModel);
  if (cfg.ollamaUrl !== undefined) setSetting(KEYS.ollamaUrl, cfg.ollamaUrl);
  return getAIConfig();
}
