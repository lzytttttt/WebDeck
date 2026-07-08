import { notFound } from "next/navigation";
import { getProject } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import { Editor } from "@/components/editor/Editor";
import { normalizeDeck } from "@/lib/deck/normalize";

export default async function EditPage({
  params,
}: {
  params: { id: string };
}) {
  await ensureDb();
  const project = await getProject(params.id);
  if (!project) notFound();
  // Only normalize if the deck has already been generated
  if (project.webDeck) project.webDeck = normalizeDeck(project.webDeck);
  return <Editor project={project} />;
}
