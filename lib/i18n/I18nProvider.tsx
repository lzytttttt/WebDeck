"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppLocale, Dictionary } from "./types";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  isAppLocale,
} from "./types";
import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";

const DICTS: Record<AppLocale, Dictionary> = {
  en,
  "zh-CN": zhCN,
};

type I18nContextValue = {
  locale: AppLocale;
  t: Dictionary;
  setLocale: (locale: AppLocale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

// Resolve the boot locale from the earliest available source, in priority
// order: localStorage -> cookie (from SSR) -> navigator language -> default.
function detectLocale(initial?: AppLocale): AppLocale {
  if (typeof window === "undefined") return initial ?? DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isAppLocale(stored)) return stored;
  } catch {
    // localStorage may be unavailable (private mode); fall through.
  }
  if (initial) return initial;
  const nav = window.navigator.language.toLowerCase();
  if (nav.startsWith("zh")) return "zh-CN";
  if (nav.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

// `initialLocale` comes from the SSR cookie so the first paint matches the
// persisted choice and avoids a flash; the client then reconciles against
// localStorage (which wins) on mount.
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: AppLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(
    initialLocale ?? DEFAULT_LOCALE,
  );

  useEffect(() => {
    const resolved = detectLocale(initialLocale);
    setLocaleState(resolved);
    document.documentElement.lang = resolved;
  }, [initialLocale]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore persistence failure
    }
    // Mirror into a cookie so SSR (share page, layout) can honor the choice.
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, t: DICTS[locale], setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
