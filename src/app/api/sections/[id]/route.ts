import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

// PUT /api/sections/[id] - Update section
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const { floorId, name } = await request.json();

    const section = await db.section.findUnique({ where: { id } });
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    if (floorId) {
      const floor = await db.floor.findUnique({ where: { id: floorId } });
      if (!floor) {
        return NextResponse.json({ error: "Floor not found" }, { status: 404 });
      }
    }

    const updated = await db.section.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(floorId !== undefined && { floorId }),
      },
      include: {
        floor: { select: { id: true, name: true } },
        _count: { select: { seats: true, members: true } },
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
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/sections/[id] - Delete section
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const section = await db.section.findUnique({
      where: { id },
      include: {
        _count: { select: { seats: true, members: true } },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    if (section._count.seats > 0 || section._count.members > 0) {
      return NextResponse.json(
        { error: "Cannot delete section with existing seats or members" },
        { status: 400 }
      );
    }

    await db.section.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}