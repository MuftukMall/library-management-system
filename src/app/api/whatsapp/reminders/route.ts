import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// POST /api/whatsapp/reminders - Send all pending reminders (mock)
export async function POST() {
  try {
    await requireAuth();

    // Mock response
    return NextResponse.json({
      success: true,
      message: "Reminders sent successfully (mock)",
      remindersSent: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}