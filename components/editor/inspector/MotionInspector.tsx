"use client";

import type {
  WebDeck,
  DeckSection,
  MotionPreset,
  SectionMotionPreset,
  MotionTransition,
} from "@/types/deck";
import {
  InspectorSection,
  Field,
  ButtonGroup,
} from "./InspectorParts";
import { useI18n } from "@/lib/i18n/I18nProvider";

const DECK_PRESET_VALUES: MotionPreset[] = ["none", "fade", "slide-up", "scale", "stagger"];
const SECTION_PRESET_VALUES: SectionMotionPreset[] = ["inherit", "none", "fade", "slide-up", "scale"];
const TRANSITION_VALUES: MotionTransition[] = ["none", "fade", "slide", "zoom"];

export function MotionInspector({
  deck,
  section,
  onDeckMotion,
  onSection,
}: {
  deck: WebDeck;
  section: DeckSection | null;
  onDeckMotion: (motion: WebDeck["motion"]) => void;
  onSection: (next: DeckSection) => void;
}) {
  const { t } = useI18n();
  const m = t.inspector.motion;
  const deckPresets = DECK_PRESET_VALUES.map((value) => ({ value, label: m.presets[value] }));
  const sectionPresets = SECTION_PRESET_VALUES.map((value) => ({ value, label: m.presets[value] }));
  const transitions = TRANSITION_VALUES.map((value) => ({ value, label: m.presets[value] }));
  return (
    <>
      <InspectorSection title={m.globalTitle}>
        <Field label={m.entrancePreset}>
          <ButtonGroup
            value={deck.motion.preset}
            options={deckPresets}
            onChange={(v) =>
              onDeckMotion({ ...deck.motion, preset: v as MotionPreset })
            }
          />
        </Field>
        <Field label={m.presentTransition}>
          <ButtonGroup
            value={deck.motion.transition}
            options={transitions}
            onChange={(v) =>
              onDeckMotion({
                ...deck.motion,
                transition: v as MotionTransition,
              })
            }
          />
        </Field>
        <button
          onClick={() => onDeckMotion({ preset: "none", transition: "none" })}
          className="mt-1 w-full rounded-md border border-border py-1.5 text-xs font-semibold text-foreground hover:border-accent"
        >
          {m.disableAll}
        </button>
      </InspectorSection>

      {section ? (
        <InspectorSection title={m.sectionTitle}>
          <Field label={m.preset}>
            <ButtonGroup
              value={section.motion?.preset ?? "inherit"}
              options={sectionPresets}
              onChange={(v) =>
                onSection({
                  ...section,
                  motion: {
                    ...section.motion,
                    preset: v as SectionMotionPreset,
                  },
                })
              }
            />
          </Field>
        </InspectorSection>
      ) : (
        <InspectorSection title={m.sectionTitle}>
          <p className="text-xs text-muted-foreground">
            {m.empty}
          </p>
        </InspectorSection>
      )}
    </>
  );
}
