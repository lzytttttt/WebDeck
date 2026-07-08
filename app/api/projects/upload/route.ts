import { NextRequest, NextResponse } from "next/server";
import { parsePptx } from "@/lib/pptx/parsePptx";
import { createProject, saveUpload } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import { buildImportQualityReport } from "@/lib/pptx/importQuality";
import type { Project } from "@/types/project";
import { uid } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  await ensureDb();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "无效的上传请求" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }

  const name = file.name || "presentation.pptx";
  if (!name.toLowerCase().endsWith(".pptx")) {
    return NextResponse.json(
      { error: "只支持 .pptx 文件" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "文件过大，最大 50MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let slides;
  try {
    slides = await parsePptx(buffer);
  } catch (err) {
    console.error("[upload] parse failed:", err);
    return NextResponse.json(
      { error: "PPTX 解析失败，请确认文件未损坏" },
      { status: 422 }
    );
  }

  if (slides.length === 0) {
    return NextResponse.json(
      { error: "未能从该 PPT 中解析出任何幻灯片" },
      { status: 422 }
    );
  }

  const id = uid("proj_");
  const now = new Date().toISOString();
  const filePath = await saveUpload(id, name, buffer);
  const projectName = name.replace(/\.pptx$/i, "");

  // Only parse + store; AI generation is deferred to /api/projects/[id]/generate
  const project: Project = {
    id,
    name: projectName,
    sourceFileName: name,
    sourceFilePath: filePath,
    createdAt: now,
    updatedAt: now,
    status: "parsed",
    slides,
    importQualityReport: buildImportQualityReport(slides),
  };

  await createProject(project);

  return NextResponse.json({ id: project.id }, { status: 201 });
}
