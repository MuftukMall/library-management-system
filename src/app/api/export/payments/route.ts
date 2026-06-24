import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/export/payments?format=csv&startDate=&endDate= - Export payments as CSV
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const where: Prisma.PaymentWhereInput = {};

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) (where.paymentDate as Prisma.DateTimeNullableFilter).gte = new Date(startDate);
      if (endDate) (where.paymentDate as Prisma.DateTimeNullableFilter).lte = new Date(endDate);
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        member: { select: { name: true, phone: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    const headers = [
      "Receipt No",
      "Member Name",
      "Member Phone",
      "Amount",
      "Payment Date",
      "Valid Till",
      "Status",
    ];

    const rows = payments.map((p) => [
      escapeCsv(p.receiptNo || ""),
      escapeCsv(p.member.name),
      escapeCsv(p.member.phone),
      p.amount.toString(),
      p.paymentDate.toISOString().split("T")[0],
      p.validTill.toISOString().split("T")[0],
      p.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payments-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}