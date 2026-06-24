import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/members/[id] - Get member profile with payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const member = await db.member.findUnique({
      where: { id },
      include: {
        seat: { select: { id: true, seatNumber: true } },
        floor: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const payments = member.payments.map((p) => ({
      id: p.id,
      receiptNo: p.receiptNo,
      amount: p.amount,
      paymentDate: p.paymentDate?.toISOString() || '',
      validTill: p.validTill?.toISOString() || '',
      status: p.status,
    }));

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        whatsapp: member.whatsapp,
        address: member.address,
        joinDate: member.joinDate?.toISOString() || '',
        expiryDate: member.expiryDate?.toISOString() || '',
        fee: member.fee,
        status: member.status,
        seat: member.seat,
        floor: member.floor,
        section: member.section,
      },
      payments,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
