import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";

// GET /api/settings/backup - Download SQLite database as backup
export async function GET() {
  try {
    await requireAuth();

    const dbPath = path.join(process.cwd(), "db", "custom.db");
    const fileBuffer = await readFile(dbPath);

    const dateStr = new Date().toISOString().split("T")[0];

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="library-backup-${dateStr}.db"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}