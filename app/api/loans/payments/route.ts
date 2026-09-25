import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
