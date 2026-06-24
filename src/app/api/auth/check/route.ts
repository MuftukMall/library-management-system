import { NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";

// GET /api/auth/check - Check authentication status
export async function GET() {
  try {
    const admin = await getAuthAdmin();

    if (!admin) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: { username: admin.username },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}