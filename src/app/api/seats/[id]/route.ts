import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activityLog";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/seats/[id] - Get single seat
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const seat = await db.seat.findUnique({
      where: { id },
      include: {
        floor: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        member: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...seat,
      createdAt: seat.createdAt.toISOString(),
      updatedAt: seat.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/seats/[id] - Update seat
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const { seatNumber, floorId, sectionId, status } = await request.json();

    const seat = await db.seat.findUnique({ where: { id } });
    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    if (floorId) {
      const floor = await db.floor.findUnique({ where: { id: floorId } });
      if (!floor) {
        return NextResponse.json({ error: "Floor not found" }, { status: 404 });
      }
    }

    const updated = await db.seat.update({
      where: { id },
      data: {
        ...(seatNumber !== undefined && { seatNumber }),
        ...(floorId !== undefined && { floorId }),
        ...(sectionId !== undefined && { sectionId: sectionId || null }),
        ...(status !== undefined && { status }),
      },
      include: {
        floor: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        member: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/seats/[id] - Delete seat (auto-unassigns if occupied)
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const seat = await db.seat.findUnique({
      where: { id },
      include: {
        floor: { select: { name: true } },
        section: { select: { name: true } },
        member: { select: { name: true } },
      },
    });
    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    const seatLabel = `${seat.seatNumber} (${seat.section?.name || ''}, ${seat.floor?.name || ''})`.trim();

    // Auto-unassign if occupied
    if (seat.status === "occupied" && seat.memberId) {
      await db.member.update({
        where: { id: seat.memberId },
        data: { seatId: null, status: "inactive" },
      });
    }

    await db.seat.delete({ where: { id } });

    logActivity(
      "seat_unassigned",
      `Seat deleted: ${seatLabel}`,
      seat.status === "occupied" ? `Auto-unassigned from ${seat.member?.name || "member"} before deletion` : undefined,
      { seatId: id, seatNumber: seat.seatNumber, wasOccupied: seat.status === "occupied" }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}