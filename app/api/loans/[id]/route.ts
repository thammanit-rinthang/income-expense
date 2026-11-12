import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const loanSchema = z.object({
  name: z.string().min(1),
  person_name: z.string(),
  principal: z.number().positive(),
  interest_rate: z.number().min(0),
  term_months: z.number().positive(),
  is_paid: z.boolean().optional(),
  include_in_income: z.boolean().optional(),
  budget_id: z.number().int().positive().nullable().optional(),
  start_date: z.string().optional(),
});

const updateLoanSchema = loanSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one loan field must be provided",
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateLoanSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get existing loan to check include_in_income status
      const existingLoan = await tx.loan.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingLoan) throw new Error("Loan not found");

      const nextPrincipal = validatedData.principal ?? Number(existingLoan.principal);
      const nextBudgetId = validatedData.budget_id !== undefined ? validatedData.budget_id : existingLoan.budget_id;
      const nextIncluded = validatedData.include_in_income ?? existingLoan.include_in_income;

      // 2. Update loan
      const loan = await tx.loan.update({
        where: { id: parseInt(id) },
        data: {
          name: validatedData.name,
          person_name: validatedData.person_name,
          principal: validatedData.principal,
          interest_rate: validatedData.interest_rate,
          term_months: validatedData.term_months,
          is_paid: validatedData.is_paid,
          include_in_income: validatedData.include_in_income,
          budget_id: nextBudgetId,
          start_date: validatedData.start_date ? new Date(validatedData.start_date) : undefined,
        },
      });

      // 3. Keep the loan amount synchronized with any budget that includes it as income.
      const budgetAdjustments = new Map<number, number>();
      if (existingLoan.include_in_income && existingLoan.budget_id) {
        budgetAdjustments.set(existingLoan.budget_id, -Number(existingLoan.principal));
      }
      if (nextIncluded && nextBudgetId) {
        budgetAdjustments.set(
          nextBudgetId,
          (budgetAdjustments.get(nextBudgetId) || 0) + nextPrincipal,
        );
      }

      for (const [budgetId, adjustment] of budgetAdjustments) {
        if (adjustment === 0) continue;
        await tx.monthlyBudget.update({
          where: { id: budgetId },
          data: {
            total_income: {
              [adjustment > 0 ? "increment" : "decrement"]: Math.abs(adjustment),
            },
            remaining_spending_pool: {
              [adjustment > 0 ? "increment" : "decrement"]: Math.abs(adjustment),
            },
          },
        });
      }

      return loan;
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: parseInt(id) },
      });

      if (loan && loan.include_in_income && loan.budget_id) {
        // If it was included in income, remove it from budget before deleting
        await tx.monthlyBudget.update({
          where: { id: loan.budget_id },
          data: {
            total_income: { decrement: loan.principal },
            remaining_spending_pool: { decrement: loan.principal },
          },
        });
      }

      if (loan) {
        const payments = await tx.loanPayment.findMany({
          where: { loan_id: loan.id },
        });
        const refundsByBudget = new Map<number, number>();
        for (const payment of payments) {
          refundsByBudget.set(
            payment.budget_id,
            (refundsByBudget.get(payment.budget_id) || 0) + Number(payment.amount),
          );
        }
        for (const [budgetId, amount] of refundsByBudget) {
          await tx.monthlyBudget.update({
            where: { id: budgetId },
            data: { remaining_spending_pool: { increment: amount } },
          });
        }
      }

      await tx.loan.delete({
        where: { id: parseInt(id) },
      });
    });

    return NextResponse.json({ message: "Loan deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
