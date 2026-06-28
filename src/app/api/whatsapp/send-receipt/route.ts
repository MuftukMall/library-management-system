import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

const WA_SERVICE = "3005";

// POST /api/whatsapp/send-receipt - Send payment receipt via WhatsApp
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    // Fetch payment with member info
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        member: { select: { id: true, name: true, phone: true, whatsapp: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Get settings for library name
    const settings = await db.setting.findMany();
    const libraryName = settings.find((s) => s.key === "libraryName")?.value || "our library";

    const phone = payment.member.whatsapp || payment.member.phone;
    const validTill = payment.validTill.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const paymentDate = payment.paymentDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const message = `Dear ${payment.member.name},\n\n` +
      `📧 Payment Receipt\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `Library: ${libraryName}\n` +
      `Receipt No: ${payment.receiptNo}\n` +
      `Amount: ₹${payment.amount}\n` +
      `Date: ${paymentDate}\n` +
      `Valid Till: ${validTill}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `Thank you for your payment!`;

    try {
      const res = await fetch(`/?XTransformPort=${WA_SERVICE}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json({ error: data.error || "Failed to send receipt" }, { status: res.status });
      }

      logActivity(
        "whatsapp_receipt",
        `Receipt sent to ${payment.member.name} via WhatsApp`,
        `Receipt: ${payment.receiptNo}, Amount: ₹${payment.amount}`
      );

      return NextResponse.json({
        success: true,
        message: "Receipt sent successfully",
        phone,
        paymentId,
        timestamp: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json(
        { error: "WhatsApp service is not running. Please start the WhatsApp service and connect first." },
        { status: 503 }
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}