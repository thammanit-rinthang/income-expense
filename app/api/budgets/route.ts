import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { z } from "zod";

const createBudgetSchema = z.object({
  person_name: z.string().trim().min(1),
  month_year: z.string().optional(),
  month: z.string().optional(),
  total_income: z.coerce.number().nonnegative().default(0),
  reserved_amount: z.coerce.number().nonnegative().default(0),
}).refine((value) => Boolean(value.month_year || value.month), {
  message: "month_year or month is required",
});

async function ensureReservedAmountColumn() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "monthly_budgets"
    ADD COLUMN IF NOT EXISTS "reserved_amount" DECIMAL(65,30) NOT NULL DEFAULT 0
  `);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personName = searchParams.get("person_name");
  const monthStr = searchParams.get("month");
  const readOnly = searchParams.get("read_only") === "true";

  if (!personName || !monthStr) {
    return NextResponse.json({ error: "person_name and month are required" }, { status: 400 });
  }

  const parsed = dayjs(monthStr);
  const monthDate = new Date(Date.UTC(parsed.year(), parsed.month(), 1));

  try {
    await ensureReservedAmountColumn();

    let budget = await prisma.monthlyBudget.findFirst({
      where: {
        person_name: personName,
        month_year: monthDate,
      },
    });

    if (!budget && readOnly) {
      return NextResponse.json(null);
    }

    if (!budget) {
      // Create a default budget for the month if it doesn't exist
      budget = await prisma.monthlyBudget.create({
        data: {
          person_name: personName,
          month_year: monthDate,
          total_income: 0,
          reserved_amount: 0,
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
    await ensureReservedAmountColumn();

    const body = await request.json();
    const { id, total_income, reserved_amount } = body;

    if (!id) {
      return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
    }

    const budget = await prisma.$transaction(async (tx) => {
      const currentBudget = await tx.monthlyBudget.findUnique({
        where: { id: parseInt(id) },
      });

      if (!currentBudget) {
        throw new Error("Budget not found");
      }

      const nextIncome = total_income !== undefined ? parseFloat(total_income) : Number(currentBudget.total_income);
      const nextReserved = reserved_amount !== undefined ? parseFloat(reserved_amount) : Number(currentBudget.reserved_amount);
      const incomeDelta = nextIncome - Number(currentBudget.total_income);
      const reservedDelta = nextReserved - Number(currentBudget.reserved_amount);
      const poolDelta = incomeDelta - reservedDelta;

      return tx.monthlyBudget.update({
        where: { id: parseInt(id) },
        data: {
          total_income: nextIncome,
          reserved_amount: nextReserved,
          remaining_spending_pool: {
            [poolDelta >= 0 ? "increment" : "decrement"]: Math.abs(poolDelta),
          },
        },
      });
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Update budget error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = createBudgetSchema.parse(await request.json());
    const monthValue = body.month_year || body.month || "";
    const parsedMonth = dayjs(monthValue);
    if (!parsedMonth.isValid()) {
      return NextResponse.json({ error: "A valid month is required" }, { status: 400 });
    }

    await ensureReservedAmountColumn();
    const monthDate = new Date(Date.UTC(parsedMonth.year(), parsedMonth.month(), 1));
    const existingBudget = await prisma.monthlyBudget.findFirst({
      where: { person_name: body.person_name, month_year: monthDate },
      select: { id: true },
    });
    if (existingBudget) {
      return NextResponse.json({ error: "A budget already exists for this person and month", id: existingBudget.id }, { status: 409 });
    }

    const budget = await prisma.monthlyBudget.create({
      data: {
        person_name: body.person_name,
        month_year: monthDate,
        total_income: body.total_income,
        reserved_amount: body.reserved_amount,
        remaining_spending_pool: body.total_income - body.reserved_amount,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Create budget error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "A valid budget ID is required" }, { status: 400 });
  }

  try {
    const budget = await prisma.monthlyBudget.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            fixed_costs: true,
            categories: true,
            transactions: true,
            loan_payments: true,
            card_payments: true,
            loans: true,
            received_payments: true,
          },
        },
      },
    });
    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    if (Object.values(budget._count).some((count) => count > 0)) {
      return NextResponse.json(
        { error: "Delete linked budget records before deleting this budget.", linkedRecords: budget._count },
        { status: 409 },
      );
    }

    await prisma.monthlyBudget.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Delete budget error:", error);
    return NextResponse.json({ error: "Unable to delete budget" }, { status: 404 });
  }
}
