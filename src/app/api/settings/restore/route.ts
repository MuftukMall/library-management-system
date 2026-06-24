import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

// POST /api/settings/restore - Restore database from backup
export async function POST(request: Request) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".db")) {
      return NextResponse.json({ error: "Invalid file type. Only .db files are accepted" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate it's a valid SQLite file (SQLite files start with "SQLite format 3\000")
    const header = buffer.slice(0, 16).toString("utf8");
    if (!header.startsWith("SQLite format 3")) {
      return NextResponse.json({ error: "Invalid SQLite file format" }, { status: 400 });
    }

    // Verify we can read the current db path
    const dbPath = path.join(process.cwd(), "db", "custom.db");

    // Write the backup file
    await writeFile(dbPath, buffer);

    return NextResponse.json({ success: true, message: "Database restored successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to restore database" }, { status: 500 });
  }
}