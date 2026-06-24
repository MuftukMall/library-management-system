import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// POST /api/members/bulk-delete - Delete multiple members
export async function POST(request: Request) {
  try {
    await requireAuth();

    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No member IDs provided" }, { status: 400 });
    }

    // Find members with seats to free them
    const membersWithSeats = await db.member.findMany({
      where: { id: { in: ids }, seatId: { not: null } },
      select: { id: true, seatId: true },
    });

    // Free up seats
    if (membersWithSeats.length > 0) {
      await db.seat.updateMany({
        where: { memberId: { in: membersWithSeats.map((m) => m.id) } },
        data: { status: "available", memberId: null },
      });
    }

    // Delete members (payments cascade)
    const result = await db.member.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete members" }, { status: 500 });
  }
}