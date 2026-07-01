import { notFound } from "next/navigation";
import { getProject } from "@/lib/storage/projectStore";
import { Editor } from "@/components/editor/Editor";
import { normalizeDeck } from "@/lib/deck/normalize";

export default async function EditPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProject(params.id);
  if (!project) notFound();
  if (project.webDeck) project.webDeck = normalizeDeck(project.webDeck);
  return <Editor project={project} />;
}
