import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getBillingPeriod } from "@/lib/billing";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);
    
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    
    const targetDate = month ? new Date(month) : new Date();
    const { start, end } = getBillingPeriod(targetDate);

    const payments = await prisma.cardPayment.findMany({
      where: {
        card_id: id,
        paid_at: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { paid_at: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Failed to fetch card payments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
