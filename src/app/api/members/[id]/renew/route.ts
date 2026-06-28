import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/members/[id]/renew - Renew membership (auto-detects start date from last payment)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const body = await request.json();
    const { amount, paymentDate, validTill } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "amount is required" },
        { status: 400 }
      );
    }

    // Fetch member with their latest payment
    const member = await db.member.findUnique({
      where: { id },
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
    let startDate: Date;
    if (paymentDate) {
      startDate = new Date(paymentDate);
    } else if (lastValidTill) {
      startDate = new Date(lastValidTill);
    } else {
      startDate = new Date();
    }

    // Auto-calculate validTill: start date + 30 days if not provided
    const validTillObj = validTill
      ? new Date(validTill)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const receiptNo = `RCP-${Date.now()}`;

    // Create payment and update member in transaction
    const [payment, updatedMember] = await db.$transaction([
      db.payment.create({
        data: {
          memberId: id,
          amount: parseFloat(amount),
          paymentDate: startDate,
          validTill: validTillObj,
          receiptNo,
          status: "paid",
        },
      }),
      db.member.update({
        where: { id },
        data: {
          expiryDate: validTillObj,
          status: "active",
        },
        include: {
          seat: { select: { id: true, seatNumber: true } },
          floor: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      }),
    ]);

    logActivity(
      "member_renewed",
      `Membership renewed for ${member.name}`,
      `Amount: ₹${amount}, Period: ${startDate.toISOString().split('T')[0]} → ${validTillObj.toISOString().split('T')[0]}`,
      { memberId: id, paymentId: payment.id }
    );

    return NextResponse.json({
      payment: {
        ...payment,
        paymentDate: payment.paymentDate.toISOString(),
        validTill: payment.validTill.toISOString(),
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      },
      member: {
        ...updatedMember,
        joinDate: updatedMember.joinDate.toISOString(),
        expiryDate: updatedMember.expiryDate.toISOString(),
        createdAt: updatedMember.createdAt.toISOString(),
        updatedAt: updatedMember.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}