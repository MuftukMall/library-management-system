import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, subWeeks, subMonths } from "date-fns";

// GET /api/dashboard/revenue - Revenue summary
export async function GET() {
  try {
    await requireAuth();

    const now = new Date();

    // Today
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // This week (Monday to Sunday)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // This month
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Previous week and month for comparison
    const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    const [todayPayments, weekPayments, monthPayments, prevWeekPayments, prevMonthPayments] =
      await Promise.all([
        db.payment.aggregate({
          where: { paymentDate: { gte: todayStart, lte: todayEnd }, status: "paid" },
          _sum: { amount: true },
        }),
        db.payment.aggregate({
          where: { paymentDate: { gte: weekStart, lte: weekEnd }, status: "paid" },
          _sum: { amount: true },
        }),
        db.payment.aggregate({
          where: { paymentDate: { gte: monthStart, lte: monthEnd }, status: "paid" },
          _sum: { amount: true },
        }),
        db.payment.aggregate({
          where: { paymentDate: { gte: prevWeekStart, lte: prevWeekEnd }, status: "paid" },
          _sum: { amount: true },
        }),
        db.payment.aggregate({
          where: { paymentDate: { gte: prevMonthStart, lte: prevMonthEnd }, status: "paid" },
          _sum: { amount: true },
        }),
      ]);

    const todayAmount = todayPayments._sum.amount || 0;
    const weekAmount = weekPayments._sum.amount || 0;
    const monthAmount = monthPayments._sum.amount || 0;
    const prevWeekAmount = prevWeekPayments._sum.amount || 0;
    const prevMonthAmount = prevMonthPayments._sum.amount || 0;

    const weekChange = prevWeekAmount > 0 ? ((weekAmount - prevWeekAmount) / prevWeekAmount) * 100 : weekAmount > 0 ? 100 : 0;
    const monthChange = prevMonthAmount > 0 ? ((monthAmount - prevMonthAmount) / prevMonthAmount) * 100 : monthAmount > 0 ? 100 : 0;

    return NextResponse.json({
      today: todayAmount,
      thisWeek: weekAmount,
      thisMonth: monthAmount,
      prevWeek: prevWeekAmount,
      prevMonth: prevMonthAmount,
      weekChange: Math.round(weekChange),
      monthChange: Math.round(monthChange),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}