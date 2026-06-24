import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function GET() {
  try {
    await requireAuth();
    const now = new Date();

    const [activeMembers, expiredMembers] = await Promise.all([
      db.member.count({ where: { expiryDate: { gt: now } } }),
      db.member.count({ where: { expiryDate: { lte: now } } }),
    ]);
    const memberStatusDistribution = [
      { status: "Active", count: activeMembers },
      { status: "Expired", count: expiredMembers },
    ];

    const floors = await db.floor.findMany({
      include: { sections: { include: { seats: true } } },
    });

    const seatOccupancyByFloor = floors.map((floor) => {
      const allSeats = floor.sections.flatMap((s) => s.seats);
      const total = allSeats.length;
      const occupied = allSeats.filter((s) => s.status === "occupied").length;
      return {
        floorName: floor.name,
        total,
        occupied,
        available: total - occupied,
        percentage: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    });

    const [paidAgg, pendingAgg] = await Promise.all([
      db.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true }, _count: true }),
      db.payment.aggregate({ where: { status: "pending" }, _sum: { amount: true }, _count: true }),
    ]);
    const paymentStatusDistribution = [
      { status: "Paid", count: paidAgg._count, totalAmount: paidAgg._sum.amount || 0 },
      { status: "Pending", count: pendingAgg._count, totalAmount: pendingAgg._sum.amount || 0 },
    ];

    const topMembersRaw = await db.payment.groupBy({
      by: ["memberId"],
      where: { status: "paid" },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    });

    const topMembers = await Promise.all(
      topMembersRaw.map(async (pm) => {
        const member = await db.member.findUnique({
          where: { id: pm.memberId },
          select: { name: true, phone: true },
        });
        return {
          name: member?.name || "Unknown",
          phone: member?.phone || "",
          totalPaid: pm._sum.amount || 0,
          paymentCount: pm._count,
        };
      })
    );

    const revenueByMonth: { month: string; amount: number }[] = [];
    const newMembersByMonth: { month: string; count: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = `${MONTH_NAMES[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;

      const rev = await db.payment.aggregate({
        where: { paymentDate: { gte: startDate, lte: endDate }, status: "paid" },
        _sum: { amount: true },
      });
      revenueByMonth.push({ month: label, amount: rev._sum.amount || 0 });

      const cnt = await db.member.count({ where: { createdAt: { gte: startDate, lte: endDate } } });
      newMembersByMonth.push({ month: label, count: cnt });
    }

    const totalRevenue = paidAgg._sum.amount || 0;
    const totalMembers = activeMembers + expiredMembers;
    const totalSeats = seatOccupancyByFloor.reduce((s, f) => s + f.total, 0);
    const totalOccupied = seatOccupancyByFloor.reduce((s, f) => s + f.occupied, 0);
    const occupancyRate = totalSeats > 0 ? Math.round((totalOccupied / totalSeats) * 100) : 0;
    const retentionRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
    const avgFee = totalMembers > 0
      ? Math.round((await db.member.aggregate({ _avg: { fee: true } }))._avg.fee || 0)
      : 0;

    return NextResponse.json({
      memberStatusDistribution,
      seatOccupancyByFloor,
      paymentStatusDistribution,
      topMembers,
      revenueByMonth,
      newMembersByMonth,
      kpis: { totalRevenue, avgFee, occupancyRate, retentionRate },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}