import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { budget_id, items } = body;

    if (!budget_id || !Array.isArray(items)) {
      return NextResponse.json({ error: "budget_id and items array are required" }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of items) {
        const fc = await tx.fixedCost.create({
          data: {
            budget_id: parseInt(budget_id),
            name: item.name,
            amount: parseFloat(item.amount.toString()),
            is_paid: false,
          },
        });
        results.push(fc);
      }
      return results;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Bulk create fixed costs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
