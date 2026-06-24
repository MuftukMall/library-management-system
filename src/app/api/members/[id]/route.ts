import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/members/[id] - Get single member with payments
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const member = await db.member.findUnique({
      where: { id },
      include: {
        seat: { select: { id: true, seatNumber: true, floorId: true, sectionId: true } },
        floor: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const serializedPayments = member.payments.map((p) => ({
      ...p,
      paymentDate: p.paymentDate.toISOString(),
      validTill: p.validTill.toISOString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      ...member,
      joinDate: member.joinDate.toISOString(),
      expiryDate: member.expiryDate.toISOString(),
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
      payments: serializedPayments,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/members/[id] - Update member
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { name, phone, whatsapp, address, joinDate, expiryDate, seatId, floorId, sectionId, fee, status } = body;

    // Handle seat assignment change
    const oldSeatId = existing.seatId;
    const newSeatId = seatId ?? null;

    if (newSeatId && newSeatId !== oldSeatId) {
      const seat = await db.seat.findUnique({ where: { id: newSeatId } });
      if (!seat) {
        return NextResponse.json({ error: "Seat not found" }, { status: 404 });
      }
      if (seat.status === "occupied") {
        return NextResponse.json({ error: "Seat is already occupied" }, { status: 400 });
      }
    }

    const member = await db.member.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(whatsapp !== undefined && { whatsapp: whatsapp || null }),
        ...(address !== undefined && { address: address || null }),
        ...(joinDate !== undefined && { joinDate: new Date(joinDate) }),
        ...(expiryDate !== undefined && { expiryDate: new Date(expiryDate) }),
        ...(seatId !== undefined && { seatId: seatId || null }),
        ...(floorId !== undefined && { floorId: floorId || null }),
        ...(sectionId !== undefined && { sectionId: sectionId || null }),
        ...(fee !== undefined && { fee }),
        ...(status !== undefined && { status }),
      },
      include: {
        seat: { select: { id: true, seatNumber: true } },
        floor: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });

    // Update seat statuses
    if (oldSeatId && oldSeatId !== newSeatId) {
      await db.seat.update({ where: { id: oldSeatId }, data: { status: "available" } });
    }
    if (newSeatId && newSeatId !== oldSeatId) {
      await db.seat.update({ where: { id: newSeatId }, data: { status: "occupied" } });
    }

    return NextResponse.json({
      ...member,
      joinDate: member.joinDate.toISOString(),
      expiryDate: member.expiryDate.toISOString(),
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    });
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

// DELETE /api/members/[id] - Delete member
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const member = await db.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Free the seat if assigned
    if (member.seatId) {
      await db.seat.update({
        where: { id: member.seatId },
        data: { status: "available" },
      });
    }

    await db.member.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}