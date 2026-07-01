"use client";

import { useRef, useState } from "react";
import type { Asset } from "@/types/project";
import type { DeckSection, ImageSection } from "@/types/deck";
import { createSection } from "@/lib/deck/sectionFactory";
import { InspectorSection, EmptyInspector } from "./InspectorParts";
import { useI18n } from "@/lib/i18n/I18nProvider";

// Asset library + image insertion. Uploads go to the base64 asset API; the
// returned Asset is added to the project and can be inserted as an
// ImageSection, set as the selected section's background, or replace the
// current ImageSection's image.
export function MediaInspector({
  projectId,
  assets,
  selectedSection,
  onAssetsChange,
  onInsertSection,
  onUpdateSection,
}: {
  projectId: string;
  assets: Asset[];
  selectedSection: DeckSection | null;
  onAssetsChange: (assets: Asset[]) => void;
  onInsertSection: (section: DeckSection) => void;
  onUpdateSection: (section: DeckSection) => void;
}) {
  const { t } = useI18n();
  const m = t.inspector.media;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/assets/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        setError(m.uploadFailed);
        return;
      }
      const asset: Asset = await res.json();
      onAssetsChange([...assets, asset]);
    } catch {
      setError(m.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const insertAsImage = (asset: Asset) => {
    const base = createSection("image");
    if (base.type !== "image") return;
    const next: ImageSection = {
      ...base,
      image: { assetId: asset.id, url: asset.url, alt: asset.fileName },
    };
    onInsertSection(next);
  };

  const setAsBackground = (asset: Asset) => {
    if (!selectedSection) return;
    onUpdateSection({
      ...selectedSection,
      background: { assetId: asset.id, url: asset.url },
    });
  };

  const replaceImage = (asset: Asset) => {
    if (!selectedSection || selectedSection.type !== "image") return;
    onUpdateSection({
      ...selectedSection,
      image: {
        ...selectedSection.image,
        assetId: asset.id,
        url: asset.url,
      },
    });
  };

  const deleteAsset = (id: string) => {
    onAssetsChange(assets.filter((a) => a.id !== id));
  };

  const isImageSection = selectedSection?.type === "image";

  return (
    <>
      <InspectorSection title={m.upload}>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-md border border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:border-accent hover:text-foreground disabled:opacity-50"
        >
          {uploading ? m.uploading : m.uploadImage}
        </button>
        {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
      </InspectorSection>

      <InspectorSection title={m.library(assets.length)}>
        {assets.length === 0 ? (
          <EmptyInspector message={m.noAssets} />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <div key={asset.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.fileName}
                  className="aspect-square w-full rounded-md border object-cover"
                />
                <button
                  onClick={() => deleteAsset(asset.id)}
                  className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
                  aria-label="Delete asset"
                >
                  ✕
                </button>
                <div className="mt-1 flex flex-col gap-1">
                  <button
                    onClick={() => insertAsImage(asset)}
                    className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground hover:bg-accent/90"
                  >
                    {m.insert}
                  </button>
                  {isImageSection ? (
                    <button
                      onClick={() => replaceImage(asset)}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:border-accent"
                    >
                      {m.replace}
                    </button>
                  ) : null}
                  {selectedSection ? (
                    <button
                      onClick={() => setAsBackground(asset)}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:border-accent"
                    >
                      {m.asBackground}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </InspectorSection>
    </>
  );
}
