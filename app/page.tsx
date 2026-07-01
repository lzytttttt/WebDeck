"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Mail, Github } from "lucide-react";

const ICONS = ["📑", "✨", "🔗"];

export default function HomePage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <AppHeader
        nav={[
          { href: "/projects", label: t.home.myProjects },
          { href: "/demo", label: t.nav.demo },
          { href: "/projects/new", label: t.common.upload },
        ]}
      />

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-24 text-center">
          <div className="mb-5 inline-flex items-center rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            {t.home.badge}
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight text-foreground">
            {t.home.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
            {t.home.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/projects/new">
              <Button size="lg" variant="accent">
                {t.home.cta}
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                {t.home.demo}
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 pb-24 sm:grid-cols-3">
          {t.home.valuePoints.map((v, i) => (
            <div key={v.title} className="rounded-2xl border bg-card p-7 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl">
                {ICONS[i]}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {v.title}
              </h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </section>

        <section className="mb-24 rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">{t.home.ctaSectionTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            {t.home.ctaSectionDesc}
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/projects/new">
              <Button size="lg" variant="accent">
                {t.home.ctaSectionButton}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span>{t.home.footer}</span>
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
        </div>
      </footer>
    </div>
  );
}
