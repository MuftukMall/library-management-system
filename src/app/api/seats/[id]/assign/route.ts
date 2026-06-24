import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/seats/[id]/assign - Assign seat to member
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const seat = await db.seat.findUnique({ where: { id } });
    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    if (seat.status === "occupied") {
      return NextResponse.json({ error: "Seat is already occupied" }, { status: 400 });
    }

    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // If member already has a seat, free the old seat
    if (member.seatId) {
      await db.seat.update({
        where: { id: member.seatId },
        data: { status: "available" },
      });
    }

    // Assign new seat and update member
    const [updatedSeat, updatedMember] = await db.$transaction([
      db.seat.update({
        where: { id },
        data: { status: "occupied" },
        include: {
          floor: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          member: { select: { id: true, name: true } },
        },
      }),
      db.member.update({
        where: { id: memberId },
        data: { seatId: id, floorId: seat.floorId, sectionId: seat.sectionId },
        include: {
          seat: { select: { id: true, seatNumber: true } },
          floor: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
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

