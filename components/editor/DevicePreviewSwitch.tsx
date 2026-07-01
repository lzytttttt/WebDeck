"use client";

import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export type DeviceMode = "desktop" | "tablet" | "mobile";

// Canvas width per device (spec 4). Desktop is fluid; tablet/mobile clamp to a
// fixed CSS width so the responsive layout is visible inside the editor.
export const DEVICE_WIDTH: Record<DeviceMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

const OPTIONS: { id: DeviceMode; icon: typeof Monitor }[] = [
  { id: "desktop", icon: Monitor },
  { id: "tablet", icon: Tablet },
  { id: "mobile", icon: Smartphone },
];

export function DevicePreviewSwitch({
  mode,
  onChange,
}: {
  mode: DeviceMode;
  onChange: (m: DeviceMode) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-secondary/40 p-0.5">
      {OPTIONS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          title={t.device[id]}
          aria-label={t.device[id]}
          aria-pressed={mode === id}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
            mode === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
