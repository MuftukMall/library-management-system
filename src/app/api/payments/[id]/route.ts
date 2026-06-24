import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/payments/[id] - Get single payment
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        member: {
          select: { id: true, name: true, phone: true, address: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...payment,
      paymentDate: payment.paymentDate.toISOString(),
      validTill: payment.validTill.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/payments/[id] - Update payment
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const { amount, paymentDate, validTill, status } = body;

    const updated = await db.payment.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(paymentDate !== undefined && { paymentDate: new Date(paymentDate) }),
        ...(validTill !== undefined && { validTill: new Date(validTill) }),
        ...(status !== undefined && { status }),
      },
      include: {
        member: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({
      ...updated,
      paymentDate: updated.paymentDate.toISOString(),
      validTill: updated.validTill.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/payments/[id] - Delete payment
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const payment = await db.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await db.payment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}