import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/members/[id]/renew - Renew membership
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const body = await request.json();
    const { amount, validTill, paymentDate } = body;

    if (!amount || !validTill || !paymentDate) {
      return NextResponse.json(
        { error: "amount, validTill, and paymentDate are required" },
        { status: 400 }
      );
    }

    const member = await db.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const receiptNo = `RCP-${Date.now()}`;

    // Create payment and update member expiry in transaction
    const [payment, updatedMember] = await db.$transaction([
      db.payment.create({
        data: {
          memberId: id,
          amount: parseFloat(amount),
          paymentDate: new Date(paymentDate),
          validTill: new Date(validTill),
          receiptNo,
          status: "paid",
        },
      }),
      db.member.update({
        where: { id },
        data: { expiryDate: new Date(validTill) },
        include: {
          seat: { select: { id: true, seatNumber: true } },
          floor: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      }),
    ]);

    logActivity("member_renewed", `Membership renewed for ${member.name}`, `Amount: ₹${amount}, Valid till: ${validTill}`, { memberId: id, paymentId: payment.id });

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