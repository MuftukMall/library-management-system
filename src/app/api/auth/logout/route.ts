import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST /api/auth/logout - Clear auth cookie
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("auth-token", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}