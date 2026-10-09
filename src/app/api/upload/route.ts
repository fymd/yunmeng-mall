import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * POST multipart: field "file"
 * Saves under public/uploads and returns { url: "/uploads/..." }
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }

    const blob = file as File;
    if (!ALLOWED.has(blob.type)) {
      return NextResponse.json(
        { error: "仅支持 jpg/png/webp/gif" },
        { status: 400 }
      );
    }
    if (blob.size > MAX_BYTES) {
      return NextResponse.json({ error: "文件不能超过 2MB" }, { status: 400 });
    }

    const ext =
      blob.type === "image/png"
        ? "png"
        : blob.type === "image/webp"
          ? "webp"
          : blob.type === "image/gif"
            ? "gif"
            : "jpg";
    const name = `${Date.now()}_${randomBytes(4).toString("hex")}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await blob.arrayBuffer());
    await writeFile(path.join(dir, name), buf);

    return NextResponse.json({ ok: true, url: `/uploads/${name}` });
  } catch (e) {
    console.error("upload", e);
    return NextResponse.json(
      { error: "上传失败", message: String(e) },
      { status: 500 }
    );
  }
}
