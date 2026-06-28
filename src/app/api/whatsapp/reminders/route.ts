import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { Prisma } from "@prisma/client";

const WA_SERVICE = "3005";

// POST /api/whatsapp/reminders - Send renewal or expiry reminders
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json().catch(() => ({}));
    const type = body.type || "renewal"; // renewal | expiry

    const now = new Date();
    let where: Prisma.MemberWhereInput = {};

    if (type === "renewal") {
      // Members expiring within 7 days (have payments, about to expire)
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where = {
        expiryDate: { gt: now, lte: sevenDaysLater },
        payments: { some: {} },
      };
    } else if (type === "expiry") {
      // Members already expired
      where = {
        expiryDate: { lte: now },
        payments: { some: {} },
      };
    }

    // Get settings for library name
    const settings = await db.setting.findMany();
    const libraryName = settings.find((s) => s.key === "libraryName")?.value || "our library";

    const members = await db.member.findMany({
      where,
      select: { id: true, name: true, phone: true, whatsapp: true, expiryDate: true },
    });

    if (members.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No members found for ${type} reminders`,
        remindersSent: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Build messages array for bulk send
    const messages = members.map((m) => {
      const expiryDate = m.expiryDate ? new Date(m.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "N/A";
      const phone = m.whatsapp || m.phone;

      let text = "";
      if (type === "renewal") {
        text = `Dear ${m.name},\n\nYour membership at ${libraryName} is expiring on ${expiryDate}. Please renew to continue enjoying our services.\n\nThank you!`;
      } else {
        text = `Dear ${m.name},\n\nYour membership at ${libraryName} expired on ${expiryDate}. Please renew at the earliest to continue using the library.\n\nWe'd love to see you back!`;
      }

      return { phone, message: text };
    });

    // Send via WhatsApp service
    try {
      const res = await fetch(`/?XTransformPort=${WA_SERVICE}/send-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json({ error: data.error || "Failed to send reminders" }, { status: res.status });
      }

      logActivity(
        "whatsapp_reminders",
        `${type} reminders sent to ${data.sent || 0} members`,
        `Total: ${data.total}, Sent: ${data.sent}, Failed: ${data.failed}`
      );

      return NextResponse.json({
        success: true,
        ...data,
        type,
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