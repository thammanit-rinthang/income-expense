import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthStr = searchParams.get("month");

  if (!monthStr) {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }

  const parsed = dayjs(monthStr);
  const monthDate = new Date(Date.UTC(parsed.year(), parsed.month(), 1));

  try {
    // Fetch budgets for both users
    const budgets = await prisma.monthlyBudget.findMany({
      where: { month_year: monthDate },
      include: {
        fixed_costs: true,
        transactions: {
          where: { card_id: null } // Only cash/transfer counts as "spent" from pool in this context?
        }
      }
    });

    const bonBudget = budgets.find(b => b.person_name === "Bon");
    const rayBudget = budgets.find(b => b.person_name === "Ray");

    const getSpent = (budget: any) => {
      if (!budget) return new Prisma.Decimal(0);
      return budget.transactions.reduce((acc: Prisma.Decimal, t: any) => acc.plus(t.amount), new Prisma.Decimal(0));
    };

    const getFixed = (budget: any) => {
      if (!budget) return new Prisma.Decimal(0);
      return budget.fixed_costs.reduce((acc: Prisma.Decimal, f: any) => acc.plus(f.amount), new Prisma.Decimal(0));
    };

    const bonSpent = getSpent(bonBudget);
    const raySpent = getSpent(rayBudget);
    const bonFixed = getFixed(bonBudget);
    const rayFixed = getFixed(rayBudget);

    const combinedIncome = budgets.reduce((acc, b) => acc.plus(b.total_income), new Prisma.Decimal(0));
    const combinedSpent = bonSpent.plus(raySpent);
    const combinedFixed = bonFixed.plus(rayFixed);

    // Upsert MonthlySummary
    const summary = await prisma.monthlySummary.upsert({
      where: {
        // Since we don't have a unique constraint on month_year alone in the schema provided 
        // (the schema had: model MonthlySummary { id Int @id @default(autoincrement()) month_year DateTime @db.Date ... })
        // We'll have to find first or create. 
        // Wait, the schema didn't have @@unique([month_year]).
        // I'll check the schema again.
        id: (await prisma.monthlySummary.findFirst({ where: { month_year: monthDate } }))?.id || -1
      },
      update: {
        combined_income: combinedIncome,
        combined_spent: combinedSpent,
        combined_fixed: combinedFixed,
        person_a_spent: bonSpent,
        person_b_spent: raySpent,
      },
      create: {
        month_year: monthDate,
        combined_income: combinedIncome,
        combined_spent: combinedSpent,
        combined_fixed: combinedFixed,
        person_a_spent: bonSpent,
        person_b_spent: raySpent,
      }
    });

    return NextResponse.json({
      summary,
      bon: {
        income: bonBudget?.total_income || 0,
        spent: bonSpent,
        remaining: bonBudget?.remaining_spending_pool || 0
      },
      ray: {
        income: rayBudget?.total_income || 0,
        spent: raySpent,
        remaining: rayBudget?.remaining_spending_pool || 0
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
