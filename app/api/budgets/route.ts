import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personName = searchParams.get("person_name");
  const monthStr = searchParams.get("month");

  if (!personName || !monthStr) {
    return NextResponse.json({ error: "person_name and month are required" }, { status: 400 });
  }

  const monthDate = dayjs(monthStr).startOf("month").toDate();

  try {
    let budget = await prisma.monthlyBudget.findFirst({
      where: {
        person_name: personName,
        month_year: monthDate,
      },
    });

    if (!budget) {
      // Create a default budget for the month if it doesn't exist
      budget = await prisma.monthlyBudget.create({
        data: {
          person_name: personName,
          month_year: monthDate,
          total_income: 0,
          remaining_spending_pool: 0,
        },
      });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Fetch budget error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, total_income, remaining_spending_pool } = body;

    if (!id) {
      return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
    }

    const budget = await prisma.monthlyBudget.update({
      where: { id: parseInt(id) },
      data: {
        total_income: total_income !== undefined ? parseFloat(total_income) : undefined,
        remaining_spending_pool: remaining_spending_pool !== undefined ? parseFloat(remaining_spending_pool) : undefined,
      },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Update budget error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
