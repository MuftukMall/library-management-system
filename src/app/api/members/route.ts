import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/members - List members with pagination, search, filters
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status") || undefined;
    const floorId = searchParams.get("floorId") || undefined;
    const sectionId = searchParams.get("sectionId") || undefined;

    const where: Prisma.MemberWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (floorId) {
      where.floorId = floorId;
    }

    if (sectionId) {
      where.sectionId = sectionId;
    }

    const [members, total] = await Promise.all([
      db.member.findMany({
        where,
        include: {
          seat: { select: { id: true, seatNumber: true } },
          floor: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.member.count({ where }),
    ]);

    const serializedMembers = members.map((m) => ({
      ...m,
      joinDate: m.joinDate.toISOString(),
      expiryDate: m.expiryDate.toISOString(),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      members: serializedMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/members - Create member
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { name, phone, whatsapp, address, joinDate, expiryDate, seatId, floorId, sectionId, fee, status } = body;

    if (!name || !phone || !joinDate || !expiryDate) {
      return NextResponse.json({ error: "Name, phone, joinDate, and expiryDate are required" }, { status: 400 });
    }

    // Check if seat is already occupied
    if (seatId) {
      const seat = await db.seat.findUnique({ where: { id: seatId } });
      if (!seat) {
        return NextResponse.json({ error: "Seat not found" }, { status: 404 });
      }
      if (seat.status === "occupied") {
        return NextResponse.json({ error: "Seat is already occupied" }, { status: 400 });
      }
    }

    const member = await db.member.create({
      data: {
        name,
        phone,
        whatsapp: whatsapp || null,
        address: address || null,
        joinDate: new Date(joinDate),
        expiryDate: new Date(expiryDate),
        seatId: seatId || null,
        floorId: floorId || null,
        sectionId: sectionId || null,
        fee: fee ?? 0,
        status: status || "active",
      },
      include: {
        seat: { select: { id: true, seatNumber: true } },
        floor: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });

    // Update seat status if assigned
    if (seatId) {
      await db.seat.update({
        where: { id: seatId },
        data: { status: "occupied" },
      });
    }

    return NextResponse.json({
      ...member,
      joinDate: member.joinDate.toISOString(),
      expiryDate: member.expiryDate.toISOString(),
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A member with this seat already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}