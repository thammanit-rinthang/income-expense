import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const receivePaymentSchema = z.object({
  budget_id: z.number().int().positive(),
  amount: z.number().positive("Amount must be positive"),
  sender: z.string().min(1, "Sender name is required"),
  note: z.string().optional().default(""),
});

export type ReceivePaymentPayload = z.infer<typeof receivePaymentSchema>;

export interface ReceivedPayment {
  id: number;
  budget_id: number;
  amount: number;
  sender: string;
  note: string;
  received_at: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const budgetId = searchParams.get("budget_id");

  if (!budgetId) {
    return NextResponse.json({ error: "budget_id is required" }, { status: 400 });
  }

  try {
    const payments = await prisma.receivedPayment.findMany({
      where: { budget_id: parseInt(budgetId) },
      orderBy: { received_at: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Fetch received payments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = receivePaymentSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the received payment record
      const payment = await tx.receivedPayment.create({
        data: {
          budget_id: data.budget_id,
          amount: data.amount,
          sender: data.sender,
          note: data.note,
        },
      });

      // 2. Increment total_income and remaining_spending_pool atomically
      await tx.monthlyBudget.update({
        where: { id: data.budget_id },
        data: {
          total_income: { increment: data.amount },
          remaining_spending_pool: { increment: data.amount },
        },
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Receive payment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const payment = await tx.receivedPayment.findUnique({
        where: { id: parseInt(id) },
      });

      if (!payment) throw new Error("Payment not found");

      // Reverse the income addition
      await tx.monthlyBudget.update({
        where: { id: payment.budget_id },
        data: {
          total_income: { decrement: payment.amount },
          remaining_spending_pool: { decrement: payment.amount },
        },
      });

      await tx.receivedPayment.delete({ where: { id: parseInt(id) } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete received payment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
