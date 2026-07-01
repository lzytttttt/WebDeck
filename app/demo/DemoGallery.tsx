"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProjectSummary } from "@/app/api/projects/route";

// Demo Gallery (spec 2 + 13.7). Cards read localized copy from `demoMeta`,
// which carries both locales, so the gallery follows the UI language while the
// deck body stays in its authored language.
export function DemoGallery() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [demos, setDemos] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/projects?demo=1")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d: { projects: ProjectSummary[] }) => {
        if (alive) setDemos(d.projects);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const duplicate = useCallback(
    async (id: string) => {
      setDuplicating(id);
      try {
        const res = await fetch(`/api/projects/${id}/duplicate`, { method: "POST" });
        const data = (await res.json()) as { id?: string };
        if (res.ok && data.id) {
          router.push(`/projects/${data.id}/edit`);
          return;
        }
      } catch {
        // fall through to reset
      }
      setDuplicating(null);
    },
    [router],
  );

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">{t.demo.title}</h1>
          <p className="mt-2 text-muted-foreground">{t.demo.subtitle}</p>
        </div>

        {error ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            {t.demo.loadError}
          </div>
        ) : demos === null ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl border bg-secondary/40" />
            ))}
          </div>
        ) : demos.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <p className="font-medium text-foreground">{t.demo.empty.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t.demo.empty.body}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {demos.map((d) => {
              const title = d.demoMeta?.title[locale] ?? d.name;
              const description = d.demoMeta?.description[locale] ?? "";
              const themeName = d.demoMeta?.theme ?? d.theme ?? "";
              return (
                <div
                  key={d.id}
                  className="flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="accent">{themeName}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {t.demo.sections(d.sectionCount)}
                    </span>
                  </div>
                  <h2 className="mb-1.5 font-semibold leading-tight text-foreground">
                    {title}
                  </h2>
                  <p className="mb-5 flex-1 text-sm text-muted-foreground">{description}</p>
                  <div className="flex gap-2">
                    <Link href={`/projects/${d.id}/present`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        {t.demo.viewDemo}
                      </Button>
                    </Link>
                    <Button
                      className="flex-1"
                      disabled={duplicating === d.id}
                      onClick={() => duplicate(d.id)}
                    >
                      {duplicating === d.id ? t.demo.duplicating : t.demo.duplicateToMine}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
