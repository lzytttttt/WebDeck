import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectByShareId } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import { DeckRenderer } from "@/components/deck/DeckRenderer";
import { normalizeDeck } from "@/lib/deck/normalize";
import { ShareChrome } from "./ShareChrome";

export async function generateMetadata({
  params,
}: {
  params: { shareId: string };
}): Promise<Metadata> {
  await ensureDb();
  const project = await getProjectByShareId(params.shareId);
  const deck = project?.webDeck;
  if (!deck) return { title: "Web Deck" };
  const description =
    deck.subtitle ?? "An interactive web deck created with Web Deck.";
  return {
    title: deck.title,
    description,
    openGraph: {
      title: deck.title,
      description,
      type: "website",
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: { shareId: string };
}) {
  await ensureDb();
  const project = await getProjectByShareId(params.shareId);
  if (!project || !project.share?.isPublished || !project.webDeck) notFound();

  const deck = normalizeDeck(project.webDeck);

  return (
    <div className="min-h-screen bg-secondary/20">
      <main className="py-6 sm:py-10">
        <DeckRenderer deck={deck} />
      </main>
      <ShareChrome />
    </div>
  );
}
