import type { en } from "./locales/en";

// The two supported UI languages.
export type AppLocale = "zh-CN" | "en";

export const APP_LOCALES: AppLocale[] = ["zh-CN", "en"];
export const DEFAULT_LOCALE: AppLocale = "zh-CN";

// Display names are shown identically in both languages (per spec 13.2).
export const LOCALE_NAMES: Record<AppLocale, string> = {
  "zh-CN": "简体中文",
  en: "English",
};

// The English dictionary is the canonical shape; every other locale MUST
// structurally match it, which the compiler enforces via `Dictionary`.
export type Dictionary = typeof en;

export function isAppLocale(v: unknown): v is AppLocale {
  return v === "zh-CN" || v === "en";
}

export const LOCALE_COOKIE = "webdeck_locale";
export const LOCALE_STORAGE_KEY = "webdeck_locale";
