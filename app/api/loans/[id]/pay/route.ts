import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  budget_id: z.number(),
  amount: z.number().positive(),
  note: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loanId = parseInt(id);

  try {
    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create LoanPayment
      const payment = await tx.loanPayment.create({
        data: {
          loan_id: loanId,
          budget_id: validatedData.budget_id,
          amount: validatedData.amount,
          note: validatedData.note || "",
          paid_at: new Date(),
        },
      });

      // 2. Deduct from pool
      await tx.monthlyBudget.update({
        where: { id: validatedData.budget_id },
        data: {
          remaining_spending_pool: {
            decrement: validatedData.amount,
          },
        },
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
