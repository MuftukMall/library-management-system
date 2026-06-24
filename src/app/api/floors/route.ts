import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/floors - List all floors with section count
export async function GET() {
  try {
    await requireAuth();

    const floors = await db.floor.findMany({
      include: {
        _count: {
          select: { sections: true, seats: true, members: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const serialized = floors.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return NextResponse.json({ floors: serialized });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/floors - Create floor
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Floor name is required" }, { status: 400 });
    }

    const floor = await db.floor.create({
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
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}