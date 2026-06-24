import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/payments/[id]/receipt - Generate PDF receipt
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        member: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Get library settings
    const settings = await db.setting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    const libraryName = settingsMap["libraryName"] || "Library Management System";
    const libraryAddress = settingsMap["libraryAddress"] || "";
    const libraryPhone = settingsMap["libraryPhone"] || "";
    const libraryEmail = settingsMap["libraryEmail"] || "";

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // Title
    page.drawText(libraryName, {
      x: margin,
      y,
      size: 20,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 20;

    if (libraryAddress) {
      page.drawText(libraryAddress, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 14;
    }

    if (libraryPhone || libraryEmail) {
      const contactLine = [libraryPhone, libraryEmail].filter(Boolean).join(" | ");
      page.drawText(contactLine, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 14;
    }

    // Separator line
    y -= 10;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1.5,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 30;

    // RECEIPT title
    page.drawText("PAYMENT RECEIPT", {
      x: width / 2 - 70,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 30;

    // Receipt number and date
    page.drawText(`Receipt No: ${payment.receiptNo || "N/A"}`, {
      x: margin,
      y,
      size: 11,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    const dateStr = payment.paymentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    page.drawText(`Date: ${dateStr}`, {
      x: width - margin - 150,
      y,
      size: 11,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 30;

    // Member details section
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;

    page.drawText("Member Details", {
      x: margin,
      y,
      size: 13,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 22;

    const memberDetails = [
      { label: "Name", value: payment.member.name },
      { label: "Phone", value: payment.member.phone },
      { label: "Address", value: payment.member.address || "N/A" },
    ];

    for (const detail of memberDetails) {
      page.drawText(`${detail.label}:`, {
        x: margin + 10,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(detail.value, {
        x: margin + 120,
        y,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 18;
    }

    y -= 15;

    // Payment details section
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;

    page.drawText("Payment Details", {
      x: margin,
      y,
      size: 13,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 22;

    const validTillStr = payment.validTill.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const paymentDetails = [
      { label: "Amount", value: `${payment.amount.toFixed(2)}` },
      { label: "Valid Till", value: validTillStr },
      { label: "Status", value: payment.status.charAt(0).toUpperCase() + payment.status.slice(1) },
    ];

    for (const detail of paymentDetails) {
      page.drawText(`${detail.label}:`, {
        x: margin + 10,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(detail.value, {
        x: margin + 120,
        y,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 18;
    }

    // Bottom separator
    y -= 20;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1.5,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Footer
    y -= 25;
    page.drawText("Thank you for your payment!", {
      x: margin,
      y,
      size: 11,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 15;
    page.drawText("This is a computer-generated receipt and does not require a signature.", {
      x: margin,
      y,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${payment.receiptNo || payment.id}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}