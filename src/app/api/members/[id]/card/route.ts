import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const member = await db.member.findUnique({
      where: { id },
      include: {
        seat: {
          include: {
            section: { include: { floor: true } },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const settings = await db.setting.findMany();
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        address: member.address,
        joinDate: member.joinDate,
        expiryDate: member.expiryDate,
        fee: member.fee,
        status: member.status,
      },
      seat: member.seat ? {
        seatNumber: member.seat.seatNumber,
        section: member.seat.section?.name || '',
        floor: member.seat.section?.floor?.name || '',
      } : null,
      library: {
        name: settingsMap.libraryName || 'Library',
        phone: settingsMap.phone || '',
        address: settingsMap.address || '',
        email: settingsMap.email || '',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}