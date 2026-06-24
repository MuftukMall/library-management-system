import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/dashboard/activity - Return recent activity feed
export async function GET() {
  try {
    await requireAuth();

    // Try to get from ActivityLog table first
    const logs = await db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (logs.length > 0) {
      const activities = logs.map((log) => ({
        id: log.id,
        type: log.type.startsWith("member") ? "member" :
              log.type.startsWith("payment") ? "payment" :
              log.type.startsWith("seat") ? "seat" :
              "system",
        title: log.title,
        date: log.createdAt.toISOString(),
        details: log.details,
      }));
      return NextResponse.json({ activities });
    }

    // Fallback: derive from actual data
    const recentMembers = await db.member.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true, status: true },
    });

    const recentPayments = await db.payment.findMany({
      orderBy: { paymentDate: "desc" },
      take: 5,
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        status: true,
        member: { select: { name: true } },
      },
    });

    const activities = [
      ...recentMembers.map((m) => ({
        id: m.id,
        type: "member" as const,
        title: `New member: ${m.name}`,
        date: m.createdAt.toISOString(),
      })),
      ...recentPayments.map((p) => ({
        id: p.id,
        type: "payment" as const,
        title: `Payment from ${p.member.name}`,
        date: p.paymentDate.toISOString(),
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