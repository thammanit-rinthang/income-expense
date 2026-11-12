import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateLoanPaymentSchema = z.object({
  id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().optional(),
  paid_at: z.string().optional().nullable(),
}).refine((data) => data.amount !== undefined || data.note !== undefined || data.paid_at !== undefined, {
  message: "At least one payment field must be provided",
});

export async function PATCH(request: NextRequest) {
  try {
    const data = updateLoanPaymentSchema.parse(await request.json());
    const payment = await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.loanPayment.findUnique({
        where: { id: data.id },
        include: { loan: true },
      });
      if (!currentPayment) throw new Error("PAYMENT_NOT_FOUND");

      const nextAmount = data.amount ?? Number(currentPayment.amount);
      const amountDelta = nextAmount - Number(currentPayment.amount);
      const updatedPayment = await tx.loanPayment.update({
        where: { id: data.id },
        data: {
          amount: nextAmount,
          note: data.note,
          paid_at: data.paid_at === undefined
            ? undefined
            : data.paid_at
            ? new Date(data.paid_at)
            : new Date(),
        },
      });

      if (amountDelta !== 0) {
        await tx.monthlyBudget.update({
          where: { id: currentPayment.budget_id },
          data: {
            remaining_spending_pool: {
              [amountDelta > 0 ? "decrement" : "increment"]: Math.abs(amountDelta),
            },
          },
        });
      }

      const paidTotal = await tx.loanPayment.aggregate({
        where: { loan_id: currentPayment.loan_id },
        _sum: { amount: true },
      });
      await tx.loan.update({
        where: { id: currentPayment.loan_id },
        data: { is_paid: Number(paidTotal._sum.amount || 0) >= Number(currentPayment.loan.principal) },
      });

      return updatedPayment;
    });

    return NextResponse.json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Loan payment not found" }, { status: 404 });
    }
    console.error("Failed to update loan payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.loanPayment.findUnique({
        where: { id },
        include: { loan: true },
      });

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // 1. Refund payment amount back to monthly budget's remaining spending pool
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

      // 2. Delete the loan payment record
      await tx.loanPayment.delete({
        where: { id },
      });

      // 3. Update loan is_paid status if all payments are cleared or less than principal
      if (payment.loan_id) {
        const remainingPayments = await tx.loanPayment.findMany({
          where: { loan_id: payment.loan_id },
        });
        const totalPaid = remainingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
        if (totalPaid < Number(payment.loan.principal)) {
          await tx.loan.update({
            where: { id: payment.loan_id },
            data: { is_paid: false },
          });
        }
      }

      return { success: true, paymentId: id };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    console.error("Failed to delete loan payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
