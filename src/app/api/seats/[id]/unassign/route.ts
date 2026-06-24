import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/seats/[id]/unassign - Remove seat assignment
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const seat = await db.seat.findUnique({
      where: { id },
      include: { member: { select: { id: true } } },
    });

    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    if (!seat.member) {
      return NextResponse.json({ error: "Seat is not assigned to any member" }, { status: 400 });
    }

    // Free the seat and clear member's seat assignment
    const [updatedSeat, updatedMember] = await db.$transaction([
      db.seat.update({
        where: { id },
        data: { status: "available" },
        include: {
          floor: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      }),
      db.member.update({
        where: { id: seat.member.id },
        data: { seatId: null },
      }),
    ]);

    return NextResponse.json({
      seat: {
        ...updatedSeat,
        createdAt: updatedSeat.createdAt.toISOString(),
        updatedAt: updatedSeat.updatedAt.toISOString(),
      },
      member: {
        ...updatedMember,
        joinDate: updatedMember.joinDate.toISOString(),
        expiryDate: updatedMember.expiryDate.toISOString(),
        createdAt: updatedMember.createdAt.toISOString(),
        updatedAt: updatedMember.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}