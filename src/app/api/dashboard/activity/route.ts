import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/dashboard/activity - Return recent activity feed
export async function GET() {
  try {
    await requireAuth();

    // Get latest 5 members
    const recentMembers = await db.member.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        status: true,
      },
    });

    // Get latest 5 payments
    const recentPayments = await db.payment.findMany({
      orderBy: { paymentDate: "desc" },
      take: 5,
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        status: true,
        member: {
          select: { name: true },
        },
      },
    });

    // Merge and sort by date
    const activities = [
      ...recentMembers.map((m) => ({
        type: "member" as const,
        title: `New member: ${m.name}`,
        description: `Joined as ${m.status}`,
        date: m.createdAt.toISOString(),
        iconType: "member" as const,
      })),
      ...recentPayments.map((p) => ({
        type: "payment" as const,
        title: `Payment from ${p.member.name}`,
        description: `₹${p.amount} — ${p.status}`,
        date: p.paymentDate.toISOString(),
        iconType: "payment" as const,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ activities: activities.slice(0, 10) });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}