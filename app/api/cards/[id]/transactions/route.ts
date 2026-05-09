import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getBillingPeriod } from "@/lib/billing";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. เปลี่ยน Type เป็น Promise
) {
  try {
    const { id: rawId } = await params; // 2. await เพื่อดึงค่า id ออกมา
    const id = parseInt(rawId);
    
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    
    const targetDate = month ? new Date(month) : new Date();
    const { start, end } = getBillingPeriod(targetDate);

    const transactions = await prisma.transaction.findMany({
      where: {
        card_id: id,
        created_at: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { created_at: "desc" },
      include: {
        category: true,
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Failed to fetch card transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}