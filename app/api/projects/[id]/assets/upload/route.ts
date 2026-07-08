import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import type { Asset } from "@/types/project";
import { uid } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// mime -> allowed. MVP stores images as base64 data URLs on the project so the
// deck stays a single portable blob (and the static export is self-contained).
const ALLOWED: Record<string, true> = {
  "image/png": true,
  "image/jpeg": true,
  "image/webp": true,
  "image/gif": true,
};

const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await ensureDb();
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

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
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "图片过大，最大 10MB" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const mime = file.type && ALLOWED[file.type] ? file.type : EXT_MIME[ext];
  if (!mime || !ALLOWED[mime]) {
    return NextResponse.json(
      { error: "仅支持 png / jpg / jpeg / webp / gif" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  const asset: Asset = {
    id: uid("asset_"),
    projectId: params.id,
    type: "image",
    fileName: file.name || `image.${ext || "png"}`,
    mimeType: mime,
    url: dataUrl,
    createdAt: new Date().toISOString(),
  };

  const nextAssets = [...(project.assets ?? []), asset];
  await updateProject(params.id, { assets: nextAssets });

  return NextResponse.json(asset, { status: 201 });
}
