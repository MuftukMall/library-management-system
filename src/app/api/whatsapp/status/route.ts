import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// GET /api/whatsapp/status - WhatsApp connection status
export async function GET() {
  try {
    await requireAuth();

    // Mock response - we can't run real WhatsApp
    return NextResponse.json({
      status: "disconnected",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}