import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword, generateToken, requireAuth } from "@/lib/auth";
import { cookies } from "next/headers";

// POST /api/auth - Login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const admin = await db.admin.findUnique({ where: { username } });

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = generateToken({ adminId: admin.id, username: admin.username });
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true, user: { username: admin.username } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/auth/password - Change password
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuth();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
    }

    const adminRecord = await db.admin.findUnique({ where: { id: admin.adminId } });
    if (!adminRecord) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, adminRecord.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    await db.admin.update({
      where: { id: admin.adminId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}