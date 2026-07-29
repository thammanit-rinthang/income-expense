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

  const parsed = dayjs(monthStr);
  const monthDate = new Date(Date.UTC(parsed.year(), parsed.month(), 1));

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

    const [cashTransactions, paidFixedCosts, loanPayments, cardPayments] = await Promise.all([
      prisma.transaction.aggregate({
        where: { budget_id: budget.id, card_id: null },
        _sum: { amount: true },
      }),
      prisma.fixedCost.aggregate({
        where: { budget_id: budget.id, is_paid: true },
        _sum: { amount: true },
      }),
      prisma.loanPayment.aggregate({
        where: { budget_id: budget.id },
        _sum: { amount: true },
      }),
      prisma.cardPayment.aggregate({
        where: { budget_id: budget.id },
        _sum: { amount: true },
      }),
    ]);

    const cashSpent =
      Number(cashTransactions._sum.amount || 0) +
      Number(paidFixedCosts._sum.amount || 0) +
      Number(loanPayments._sum.amount || 0) +
      Number(cardPayments._sum.amount || 0);

    return NextResponse.json({
      ...budget,
      actual_spent: cashSpent,
      cash_spent: cashSpent,
    });
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
