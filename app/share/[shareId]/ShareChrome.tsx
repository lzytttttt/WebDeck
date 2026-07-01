"use client";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Mail, Github } from "lucide-react";

export function ShareChrome() {
  const { t } = useI18n();
  return (
    <footer className="border-t bg-background/60 py-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>{t.share.footer}</span>
          <span>·</span>
          <span>{t.author.builtBy} <span className="font-medium text-foreground">{t.author.name}</span></span>
          <span>·</span>
          <a
            href={`mailto:${t.author.email}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
            title={t.author.email}
          >
            <Mail className="h-4 w-4" />
          </a>
          <a
            href={t.author.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
            title="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
        <LanguageSwitcher />
      </div>
    </footer>
  );
}
