import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/export/members?format=csv - Export members as CSV
export async function GET() {
  try {
    await requireAuth();

    const members = await db.member.findMany({
      include: {
        seat: { select: { seatNumber: true } },
        floor: { select: { name: true } },
        section: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Name",
      "Phone",
      "WhatsApp",
      "Address",
      "Join Date",
      "Expiry Date",
      "Seat",
      "Floor",
      "Section",
      "Fee",
      "Status",
    ];

    const rows = members.map((m) => [
      escapeCsv(m.name),
      escapeCsv(m.phone),
      escapeCsv(m.whatsapp || ""),
      escapeCsv(m.address || ""),
      m.joinDate.toISOString().split("T")[0],
      m.expiryDate.toISOString().split("T")[0],
      escapeCsv(m.seat?.seatNumber || ""),
      escapeCsv(m.floor?.name || ""),
      escapeCsv(m.section?.name || ""),
      m.fee.toString(),
      m.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="members-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}