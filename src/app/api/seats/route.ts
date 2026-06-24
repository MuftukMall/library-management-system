import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/seats - List seats with filters
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get("floorId") || undefined;
    const sectionId = searchParams.get("sectionId") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: Record<string, unknown> = {};
    if (floorId) where.floorId = floorId;
    if (sectionId) where.sectionId = sectionId;
    if (status) where.status = status;

    const seats = await db.seat.findMany({
      where,
      include: {
        floor: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        member: { select: { id: true, name: true } },
      },
      orderBy: [{ floorId: "asc" }, { seatNumber: "asc" }],
    });

    const serialized = seats.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({ seats: serialized });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/seats - Create seat
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { seatNumber, floorId, sectionId } = await request.json();

    if (!seatNumber || !floorId) {
      return NextResponse.json({ error: "seatNumber and floorId are required" }, { status: 400 });
    }

    const floor = await db.floor.findUnique({ where: { id: floorId } });
    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    if (sectionId) {
      const section = await db.section.findUnique({ where: { id: sectionId } });
      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
    }

    const seat = await db.seat.create({
      data: {
        seatNumber,
        floorId,
        sectionId: sectionId || null,
      },
      include: {
        floor: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        member: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      ...seat,
      createdAt: seat.createdAt.toISOString(),
      updatedAt: seat.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}