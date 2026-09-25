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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loanId = parseInt(id);

  try {
    const { searchParams } = new URL(request.url);
    const paymentIdParam = searchParams.get("paymentId");

    const result = await prisma.$transaction(async (tx) => {
      let payment;
      if (paymentIdParam) {
        payment = await tx.loanPayment.findUnique({
          where: { id: parseInt(paymentIdParam) },
          include: { loan: true },
        });
      } else {
        // Delete latest payment for this loan
        payment = await tx.loanPayment.findFirst({
          where: { loan_id: loanId },
          orderBy: { paid_at: "desc" },
          include: { loan: true },
        });
      }

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // Refund to budget
      if (payment.budget_id) {
        await tx.monthlyBudget.update({
          where: { id: payment.budget_id },
          data: {
            remaining_spending_pool: {
              increment: payment.amount,
            },
          },
        });
      }

      await tx.loanPayment.delete({
        where: { id: payment.id },
      });

      const remainingPayments = await tx.loanPayment.findMany({
        where: { loan_id: loanId },
      });
      const totalPaid = remainingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
      if (totalPaid < Number(payment.loan.principal)) {
        await tx.loan.update({
          where: { id: loanId },
          data: { is_paid: false },
        });
      }

      return { success: true, paymentId: payment.id };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    console.error("Delete loan payment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
