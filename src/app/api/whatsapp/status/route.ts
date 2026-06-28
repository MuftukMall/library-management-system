import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const WA_SERVICE = "3005";

async function proxyRequest(request: NextRequest, method: string) {
  const url = `/?XTransformPort=${WA_SERVICE}/status`;
  const init: RequestInit = { method, headers: {} };
  if (method === "POST" || method === "DELETE") {
    init.body = JSON.stringify({});
    init.headers = { "Content-Type": "application/json" };
  }

  const res = await fetch(url, init);
  const data = await res.json();
  return { status: res.status, data };
}

// GET /api/whatsapp/status
export async function GET() {
  try {
    await requireAuth();
    const { status, data } = await proxyRequest(new NextRequest("http://localhost"), "GET");
    return NextResponse.json(data, { status });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // If the service is unreachable, return disconnected
    return NextResponse.json({ status: "disconnected", connected: false, qrCode: null });
  }
}

// POST /api/whatsapp/status - Request QR / connect
export async function POST() {
  try {
    await requireAuth();
    const { status, data } = await proxyRequest(new NextRequest("http://localhost"), "POST");
    return NextResponse.json(data, { status });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "WhatsApp service is not running" }, { status: 503 });
  }
}

// DELETE /api/whatsapp/status - Disconnect
export async function DELETE() {
  try {
    await requireAuth();
    const { status, data } = await proxyRequest(new NextRequest("http://localhost"), "DELETE");
    return NextResponse.json(data, { status });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "WhatsApp service is not running" }, { status: 503 });
  }
}