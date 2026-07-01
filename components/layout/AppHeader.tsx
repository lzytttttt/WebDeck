"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { cn } from "@/lib/utils";

// Shared top chrome for the marketing/dashboard/demo pages: product mark,
// optional nav links, and the always-present language switcher.
export function AppHeader({
  nav = [],
  className,
}: {
  nav?: { href: string; label: string }[];
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <header
      className={cn(
        "mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5",
        className,
      )}
    >
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold text-foreground"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          W
        </span>
        {t.home.productName}
      </Link>
      <nav className="flex items-center gap-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
