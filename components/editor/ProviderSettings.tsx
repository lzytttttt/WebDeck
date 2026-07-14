"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type AISettings = {
  provider: "anthropic" | "openai" | "ollama" | "mock";
  anthropicKey: string;
  openaiKey: string;
  openaiModel: string;
  ollamaUrl: string;
};

const EMPTY: AISettings = {
  provider: "mock",
  anthropicKey: "",
  openaiKey: "",
  openaiModel: "",
  ollamaUrl: "",
};

/**
 * Modal that lets the user pick which AI provider powers deck generation and
 * supply the matching credentials. Saved settings are persisted via
 * /api/settings/ai-provider and applied by the generate pipeline.
 */
export function ProviderSettings({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const s = t.settings;
  const [cfg, setCfg] = useState<AISettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/settings/ai-provider")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setCfg({ ...EMPTY, ...d });
      })
      .catch(() => {
        if (alive) setCfg(EMPTY);
      });
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!cfg) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-xl border bg-background p-5 text-sm text-muted-foreground shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {t.common.loading}
        </div>
      </div>
    );
  }

  const set = <K extends keyof AISettings>(key: K, value: AISettings[K]) =>
    setCfg({ ...cfg, [key]: value });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-background p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">{s.title}</h2>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium">{s.provider}</span>
          <select
            value={cfg.provider}
            onChange={(e) => set("provider", e.target.value as AISettings["provider"])}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="mock">{s.mock}</option>
            <option value="anthropic">{s.anthropic}</option>
            <option value="openai">{s.openai}</option>
            <option value="ollama">{s.ollama}</option>
          </select>
        </label>

        {cfg.provider === "anthropic" && (
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium">{s.apiKey}</span>
            <input
              type="password"
              value={cfg.anthropicKey}
              placeholder="sk-ant-..."
              onChange={(e) => set("anthropicKey", e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>
        )}

        {cfg.provider === "openai" && (
          <>
            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium">{s.apiKey}</span>
              <input
                type="password"
                value={cfg.openaiKey}
                placeholder="sk-..."
                onChange={(e) => set("openaiKey", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium">{s.model}</span>
              <input
                value={cfg.openaiModel}
                placeholder="gpt-4o"
                onChange={(e) => set("openaiModel", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          </>
        )}

        {cfg.provider === "ollama" && (
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium">{s.baseUrl}</span>
            <input
              value={cfg.ollamaUrl}
              placeholder="http://localhost:11434"
              onChange={(e) => set("ollamaUrl", e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            {t.common.close}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t.common.saving : s.save}
          </button>
        </div>

        {saved && <p className="mt-2 text-sm text-green-600">{s.saved}</p>}
      </div>
    </div>
  );
}
