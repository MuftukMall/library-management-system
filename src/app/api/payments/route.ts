import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { Prisma } from "@prisma/client";

// GET /api/payments - List payments with filters
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
    const rawStatus = searchParams.get("status");
    const status = rawStatus && rawStatus !== "all" ? rawStatus : undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const where: Prisma.PaymentWhereInput = {};

    if (memberId) where.memberId = memberId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) (where.paymentDate as Prisma.DateTimeNullableFilter).gte = new Date(startDate);
      if (endDate) (where.paymentDate as Prisma.DateTimeNullableFilter).lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          member: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ]);

    const serialized = payments.map((p) => ({
      ...p,
      paymentDate: p.paymentDate.toISOString(),
      validTill: p.validTill.toISOString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      payments: serialized,
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

// POST /api/payments - Create payment (auto-detects start date, auto-calculates validTill)
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { memberId, amount, paymentDate, validTill, status } = body;

    if (!memberId || !amount) {
      return NextResponse.json(
        { error: "memberId and amount are required" },
        { status: 400 }
      );
    }

    // Fetch member with latest payment for auto-date detection
    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        payments: {
          orderBy: { validTill: "desc" },
          take: 1,
          select: { validTill: true },
        },
      },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Auto-detect start date: use last payment's validTill, fallback to paymentDate, then today
    const lastValidTill = member.payments[0]?.validTill;
    const startDate = paymentDate
      ? new Date(paymentDate)
      : lastValidTill
        ? new Date(lastValidTill)
        : new Date();

    // Auto-calculate validTill: start date + 30 days if not provided
    const validTillObj = validTill
      ? new Date(validTill)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const receiptNo = `RCP-${Date.now()}`;

    // Create payment and update member in transaction
    const [payment] = await db.$transaction([
      db.payment.create({
        data: {
          memberId,
          amount: parseFloat(amount),
          paymentDate: startDate,
          validTill: validTillObj,
          receiptNo,
          status: status || "paid",
        },
      }),
      db.member.update({
        where: { id: memberId },
        data: {
          expiryDate: validTillObj,
          status: "active",
        },
      }),
    ]);

    logActivity(
      "payment_created",
      `Payment of ₹${payment.amount} received from ${member.name}`,
      `Receipt: ${receiptNo}, Period: ${startDate.toISOString().split('T')[0]} → ${validTillObj.toISOString().split('T')[0]}`,
      { paymentId: payment.id, memberId }
    );

    return NextResponse.json({
      ...payment,
      paymentDate: payment.paymentDate.toISOString(),
      validTill: payment.validTill.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}