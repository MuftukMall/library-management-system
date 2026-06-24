import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// GET /api/dashboard - Dashboard statistics
export async function GET() {
  try {
    await requireAuth();

    const now = new Date();

    // Get last 6 months data
    const monthlyCollection: { month: string; amount: number }[] = [];
    const memberGrowth: { month: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthLabel = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

      // Monthly revenue - sum of paid payments in this month
      const monthlyPayments = await db.payment.findMany({
        where: {
          paymentDate: { gte: startDate, lte: endDate },
          status: "paid",
        },
        select: { amount: true },
      });

      const totalAmount = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
      monthlyCollection.push({ month: monthLabel, amount: totalAmount });

      // Member growth - new members in this month
      const newMembersCount = await db.member.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      memberGrowth.push({ month: monthLabel, count: newMembersCount });
    }

    // Current month start
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Monthly revenue (current month)
    const currentMonthPayments = await db.payment.findMany({
      where: {
        paymentDate: { gte: currentMonthStart, lte: currentMonthEnd },
        status: "paid",
      },
      select: { amount: true },
    });
    const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    // Pending payments
    const pendingPayments = await db.payment.count({
      where: { status: "pending" },
    });

    // Parallel counts
    const [totalMembers, activeMembers, totalSeats, occupiedSeats] = await Promise.all([
      db.member.count(),
      db.member.count({
        where: { expiryDate: { gt: now } },
      }),
      db.seat.count(),
      db.seat.count({
        where: { status: "occupied" },
      }),
    ]);

    const expiredMembers = totalMembers - activeMembers;
    const availableSeats = totalSeats - occupiedSeats;

    return NextResponse.json({
      totalMembers,
      activeMembers,
      expiredMembers,
      totalSeats,
      occupiedSeats,
      availableSeats,
      monthlyRevenue,
      pendingPayments,
      monthlyCollection,
      memberGrowth,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}