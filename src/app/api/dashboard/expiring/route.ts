import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/dashboard/expiring - Members expiring in next 7 days
export async function GET() {
  try {
    await requireAuth();

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringMembers = await db.member.findMany({
      where: {
        expiryDate: {
          gt: now,
          lte: sevenDaysLater,
        },
        status: "active",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        expiryDate: true,
      },
      orderBy: { expiryDate: "asc" },
    });

    return NextResponse.json({
      count: expiringMembers.length,
      members: expiringMembers.map((m) => ({
        id: m.id,
        name: m.name,
        phone: m.phone,
        expiryDate: m.expiryDate.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}