import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

const WA_SERVICE = "3005";

// POST /api/whatsapp/send - Send WhatsApp message
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: "phone and message are required" }, { status: 400 });
    }

    // Proxy to WhatsApp service
    try {
      const res = await fetch(`/?XTransformPort=${WA_SERVICE}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json({ error: data.error || "Failed to send message" }, { status: res.status });
      }

      logActivity("whatsapp_sent", `WhatsApp message sent to ${phone}`, message.slice(0, 100));

      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ error: "WhatsApp service is not running. Please start the WhatsApp service and connect first." }, { status: 503 });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}