import { notFound } from "next/navigation";
import { getProject } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import { Presenter } from "@/components/deck/Presenter";
import { normalizeDeck } from "@/lib/deck/normalize";

export default async function PresentPage({
  params,
}: {
  params: { id: string };
}) {
  await ensureDb();
  const project = await getProject(params.id);
  if (!project || !project.webDeck) notFound();
  return <Presenter deck={normalizeDeck(project.webDeck)} />;
}
