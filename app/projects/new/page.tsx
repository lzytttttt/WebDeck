"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { UploadDropzone } from "@/components/upload/UploadDropzone";

export default function NewProjectPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <AppHeader nav={[{ href: "/projects", label: t.nav.projects }]} />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold text-foreground">{t.upload.pageTitle}</h1>
        <p className="mb-10 text-center text-muted-foreground">{t.upload.pageSubtitle}</p>
        <UploadDropzone />
      </main>
    </div>
  );
}
