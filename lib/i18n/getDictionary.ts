import { cookies } from "next/headers";
import type { AppLocale, Dictionary } from "./types";
import { LOCALE_COOKIE, DEFAULT_LOCALE, isAppLocale } from "./types";
import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";

const DICTS: Record<AppLocale, Dictionary> = {
  en,
  "zh-CN": zhCN,
};

/**
 * Server-side dictionary accessor. Reads the locale cookie and returns the
 * matching dictionary. Only usable in Server Components and route handlers.
 */
export function getDictionary(): { locale: AppLocale; t: Dictionary } {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  return { locale, t: DICTS[locale] };
}
