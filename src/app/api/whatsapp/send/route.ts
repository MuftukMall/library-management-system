import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// POST /api/whatsapp/send - Send WhatsApp message (mock)
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: "phone and message are required" }, { status: 400 });
    }

    // Mock response
    return NextResponse.json({
      success: true,
      message: "Message sent successfully (mock)",
      phone,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}