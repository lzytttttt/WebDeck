import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = ""): string {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `${prefix}${id}`;
}

// Locale-aware short date. Used by dashboard/demo cards. zh-CN and en both
// resolve to their native Intl formatting; the AppLocale strings are valid
// BCP-47 tags so we pass them straight through.
export function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
