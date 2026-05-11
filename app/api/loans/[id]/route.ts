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
  budget_id: z.number().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = loanSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get existing loan to check include_in_income status
      const existingLoan = await tx.loan.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingLoan) throw new Error("Loan not found");

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
        },
      });

      // 3. Handle budget adjustment if include_in_income changed
      const budgetId = validatedData.budget_id || existingLoan.budget_id;
      
      if (budgetId) {
        const oldIncluded = existingLoan.include_in_income;
        const newIncluded = validatedData.include_in_income;

        if (!oldIncluded && newIncluded) {
          // Toggle ON: Add to budget
          await tx.monthlyBudget.update({
            where: { id: budgetId },
            data: {
              total_income: { increment: validatedData.principal },
              remaining_spending_pool: { increment: validatedData.principal },
            },
          });
        } else if (oldIncluded && !newIncluded) {
          // Toggle OFF: Remove from budget (use existingLoan.principal for accuracy if principal changed, but usually we use the current one)
          await tx.monthlyBudget.update({
            where: { id: budgetId },
            data: {
              total_income: { decrement: existingLoan.principal },
              remaining_spending_pool: { decrement: existingLoan.principal },
            },
          });
        } else if (oldIncluded && newIncluded && !existingLoan.principal.equals(validatedData.principal)) {
            // Principal changed while still included: Adjust the difference
            const diff = Number(validatedData.principal) - Number(existingLoan.principal);
            await tx.monthlyBudget.update({
                where: { id: budgetId },
                data: {
                    total_income: { increment: diff },
                    remaining_spending_pool: { increment: diff },
                },
            });
        }
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
