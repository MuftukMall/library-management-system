import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

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

// DELETE /api/seats/[id] - Delete seat (only if available)
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const seat = await db.seat.findUnique({ where: { id } });
    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    if (seat.status === "occupied") {
      return NextResponse.json(
        { error: "Cannot delete an occupied seat. Unassign it first." },
        { status: 400 }
      );
    }

    await db.seat.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}