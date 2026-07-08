import type { DeckSection } from "@/types/deck";

export type SectionDefinition = {
  type: string;
  label: string;
  create: () => DeckSection;
  Component: React.ComponentType<{ section: any }>;
  renderStatic: (section: any) => string;
  staticCss?: string;
  hasContent: (section: any) => boolean;
  schemaHint: string;
};

const registry = new Map<string, SectionDefinition>();

export function registerSection(def: SectionDefinition) {
  registry.set(def.type, def);
}

export function getSection(type: string): SectionDefinition | undefined {
  return registry.get(type);
}

export function getAllSections(): SectionDefinition[] {
  return Array.from(registry.values());
}

export function getAddableSections(): SectionDefinition[] {
  return getAllSections().filter((s) => s.type !== "slide");
}
