import { notFound } from "next/navigation";
import { getProject } from "@/lib/storage/projectStore";
import { Presenter } from "@/components/deck/Presenter";
import { normalizeDeck } from "@/lib/deck/normalize";

export default async function PresentPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProject(params.id);
  if (!project || !project.webDeck) notFound();
  return <Presenter deck={normalizeDeck(project.webDeck)} />;
}
