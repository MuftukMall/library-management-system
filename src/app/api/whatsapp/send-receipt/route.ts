import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// POST /api/whatsapp/send-receipt - Send receipt via WhatsApp (mock)
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    // Mock response
    return NextResponse.json({
      success: true,
      message: "Receipt sent successfully via WhatsApp (mock)",
      paymentId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}