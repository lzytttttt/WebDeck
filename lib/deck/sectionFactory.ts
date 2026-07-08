import type { DeckSection, DeckSectionType } from "@/types/deck";
import { uid } from "@/lib/utils";
import {
  getSection,
  getAddableSections,
} from "@/lib/deck/sections";

// Blank-section factory for the "Add Section" flow. Each new section gets
// sensible placeholder content so the canvas never renders an empty void.

export const ADDABLE_SECTIONS: { type: DeckSectionType; label: string }[] =
  getAddableSections().map((s) => ({ type: s.type as DeckSectionType, label: s.label }));

export function createSection(type: DeckSectionType): DeckSection {
  const id = uid("sec_");
  const def = getSection(type);
  const section = def ? def.create() : getSection("slide")!.create();
  section.id = id;
  return section;
}

// Deep-clone a section for duplication, minting a fresh id.
export function duplicateSection(section: DeckSection): DeckSection {
  const clone: DeckSection = JSON.parse(JSON.stringify(section));
  clone.id = uid("sec_");
  return clone;
}
