"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";

type UploadState = "idle" | "uploading" | "error";

function isIdResponse(v: unknown): v is { id: string } {
  return (
    typeof v === "object" && v !== null && "id" in v && typeof v.id === "string"
  );
}


const MAX_SIZE = 50 * 1024 * 1024;

export function UploadDropzone() {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const upload = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".pptx")) {
        setError(t.upload.onlyPptx);
        setState("error");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(t.upload.tooLarge);
        setState("error");
        return;
      }

      setFileName(file.name);
      setState("uploading");
      setProgress(0);

      // XMLHttpRequest for real upload progress events.
      const form = new FormData();
      form.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/projects/upload");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(xhr.responseText);
        } catch {
          parsed = null;
        }
        if (xhr.status >= 200 && xhr.status < 300 && isIdResponse(parsed)) {
          router.push(`/projects/${parsed.id}/edit`);
          return;
        }
        setError(t.upload.failed);
        setState("error");
      };

      xhr.onerror = () => {
        setError(t.upload.failed);
        setState("error");
      };

      xhr.send(form);
    },
    [router, t]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) upload(file);
    },
    [upload]
  );

  return (
    <div className="w-full max-w-xl">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card px-6 py-16 text-center transition-colors hover:border-accent"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pptx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl">
          📊
        </div>
        {state === "uploading" ? (
          <>
            <p className="font-medium text-foreground">
              {fileName ? `${fileName} · ` : ""}{t.upload.uploading}
            </p>
            <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.max(progress, 8)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {progress < 100 ? `${t.upload.uploading} ${progress}%` : t.upload.parsing}
            </p>
            {progress >= 100 && (
              <p className="mt-1 text-xs text-muted-foreground">
                解析完成，即将跳转到编辑页面…
              </p>
            )}
          </>
        ) : (
          <>
            <p className="font-medium text-foreground">{t.upload.dropHint}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              50MB · PowerPoint (.pptx)
            </p>
            <Button className="mt-5" type="button">
              {t.upload.chooseFile}
            </Button>
          </>
        )}
      </div>
      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
