import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/sections - List sections, optional floor filter
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get("floorId") || undefined;

    const where = floorId ? { floorId } : {};

    const sections = await db.section.findMany({
      where,
      include: {
        floor: { select: { id: true, name: true } },
        _count: { select: { seats: true, members: true } },
      },
      orderBy: { name: "asc" },
    });

    const serialized = sections.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({ sections: serialized });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/sections - Create section
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { floorId, name } = await request.json();

    if (!floorId || !name) {
      return NextResponse.json({ error: "floorId and name are required" }, { status: 400 });
    }

    const floor = await db.floor.findUnique({ where: { id: floorId } });
    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    const section = await db.section.create({
      data: { floorId, name },
      include: {
        floor: { select: { id: true, name: true } },
        _count: { select: { seats: true, members: true } },
      },
    });

    return NextResponse.json({
      ...section,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}