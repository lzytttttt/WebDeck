"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./ProjectCard";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import type { ProjectSummary } from "@/app/api/projects/route";

type SortKey = "updated" | "created" | "name";

export function ProjectsDashboard() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [pendingDelete, setPendingDelete] = useState<ProjectSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/projects?demo=0");
      if (!res.ok) throw new Error();
      const data: { projects: ProjectSummary[] } = await res.json();
      setProjects(data.projects);
    } catch {
      setError(true);
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (!projects) return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? projects.filter((p) => p.name.toLowerCase().includes(q))
      : projects.slice();
    filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const key = sort === "created" ? "createdAt" : "updatedAt";
      return new Date(b[key]).getTime() - new Date(a[key]).getTime();
    });
    return filtered;
  }, [projects, query, sort]);

  const duplicate = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data: { id: string } = await res.json();
      router.push(`/projects/${data.id}/edit`);
    } catch {
      setError(true);
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setBusyId(id);
    setPendingDelete(null);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProjects((cur) => (cur ? cur.filter((p) => p.id !== id) : cur));
    } catch {
      setError(true);
    } finally {
      setBusyId(null);
    }
  };

  const empty = projects && projects.length === 0 && !query;

  return (
    <div className="min-h-screen">
      <AppHeader
        nav={[
          { href: "/demo", label: t.nav.demo },
          { href: "/projects/new", label: t.nav.newProject },
        ]}
      />
      <main className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.dashboard.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.dashboard.subtitle}</p>
          </div>
          <Link href="/projects/new">
            <Button variant="accent">{t.dashboard.newProject}</Button>
          </Link>
        </div>

        {error ? (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            <span>{t.dashboard.loadError}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              {t.common.retry}
            </Button>
          </div>
        ) : null}

        {projects === null ? (
          <DashboardSkeleton />
        ) : empty ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.dashboard.searchPlaceholder}
                  className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                {t.dashboard.sortBy}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="updated">{t.dashboard.sortUpdated}</option>
                  <option value="created">{t.dashboard.sortCreated}</option>
                  <option value="name">{t.dashboard.sortName}</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  busy={busyId === p.id}
                  locale={locale}
                  onDuplicate={() => void duplicate(p.id)}
                  onDelete={() => setPendingDelete(p)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <ConfirmDeleteModal
        project={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-2xl border bg-secondary/40" />
      ))}
    </div>
  );
}

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card py-20 text-center">
      <div className="mb-3 text-4xl">📂</div>
      <h2 className="text-lg font-semibold text-foreground">{t.dashboard.empty.title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{t.dashboard.empty.body}</p>
      <div className="mt-6 flex gap-3">
        <Link href="/projects/new">
          <Button variant="accent">{t.dashboard.empty.action}</Button>
        </Link>
        <Link href="/demo">
          <Button variant="outline">{t.dashboard.empty.demoAction}</Button>
        </Link>
      </div>
    </div>
  );
}
