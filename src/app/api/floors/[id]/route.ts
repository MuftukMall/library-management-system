import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/floors/[id] - Get single floor
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const floor = await db.floor.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            _count: { select: { seats: true, members: true } },
          },
          orderBy: { name: "asc" },
        },
        _count: {
          select: { sections: true, seats: true, members: true },
        },
      },
    });

    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    const serializedSections = floor.sections.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      ...floor,
      createdAt: floor.createdAt.toISOString(),
      updatedAt: floor.updatedAt.toISOString(),
      sections: serializedSections,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/floors/[id] - Update floor
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Floor name is required" }, { status: 400 });
    }

    const floor = await db.floor.update({
      where: { id },
      data: { name },
      include: {
        _count: {
          select: { sections: true, seats: true, members: true },
        },
      },
    });

    return NextResponse.json({
      ...floor,
      createdAt: floor.createdAt.toISOString(),
      updatedAt: floor.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/floors/[id] - Delete floor
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const floor = await db.floor.findUnique({
      where: { id },
      include: {
        _count: { select: { sections: true, seats: true, members: true } },
      },
    });

    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    if (floor._count.sections > 0 || floor._count.seats > 0 || floor._count.members > 0) {
      return NextResponse.json(
        { error: "Cannot delete floor with existing sections, seats, or members" },
        { status: 400 }
      );
    }

    await db.floor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}