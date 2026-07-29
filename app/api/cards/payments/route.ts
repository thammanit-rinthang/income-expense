import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  card_id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  note: z.string().optional().default(""),
  paid_at: z.string().optional().nullable(),
  budget_id: z.coerce.number().int().positive().optional().nullable(),
});

const updatePaymentSchema = z.object({
  id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().optional(),
  paid_at: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = paymentSchema.parse(body);

    // Use a transaction to create the payment and update the card balance
    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.creditCard.findUnique({
        where: { id: data.card_id },
        select: { statement_balance: true },
      });

      if (!card) {
        throw new Error("CARD_NOT_FOUND");
      }

      if (data.amount > Number(card.statement_balance)) {
        throw new Error("PAYMENT_EXCEEDS_BALANCE");
      }

      const payment = await tx.cardPayment.create({
        data: {
          card_id: data.card_id,
          amount: data.amount,
          note: data.note,
          paid_at: data.paid_at ? new Date(data.paid_at) : new Date(),
          budget_id: data.budget_id ?? null,
        },
      });

      // Update the card's statement balance
      const updatedCard = await tx.creditCard.update({
        where: { id: data.card_id },
        data: {
          statement_balance: {
            decrement: data.amount,
          },
        },
      });

      if (data.budget_id) {
        await tx.monthlyBudget.update({
          where: { id: data.budget_id },
          data: {
            remaining_spending_pool: {
              decrement: data.amount,
            },
          },
        });
      }

      return { payment, updatedCard };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    if (error instanceof Error && error.message === "PAYMENT_EXCEEDS_BALANCE") {
      return NextResponse.json({ error: "Payment amount exceeds card balance" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "CARD_NOT_FOUND") {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    console.error("Failed to record card payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const data = updatePaymentSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.cardPayment.findUnique({
        where: { id: data.id },
        include: { card: true },
      });

      if (!currentPayment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      const nextAmount = data.amount ?? Number(currentPayment.amount);
      const currentAmount = Number(currentPayment.amount);
      const amountDelta = nextAmount - currentAmount;
      const maxPayable = Number(currentPayment.card.statement_balance) + currentAmount;

      if (nextAmount > maxPayable) {
        throw new Error("PAYMENT_EXCEEDS_BALANCE");
      }

      const payment = await tx.cardPayment.update({
        where: { id: data.id },
        data: {
          amount: nextAmount,
          note: data.note !== undefined ? data.note : undefined,
          paid_at: data.paid_at !== undefined ? (data.paid_at ? new Date(data.paid_at) : new Date()) : undefined,
        },
      });

      if (amountDelta !== 0) {
        await tx.creditCard.update({
          where: { id: currentPayment.card_id },
          data: {
            statement_balance: {
              [amountDelta > 0 ? "decrement" : "increment"]: Math.abs(amountDelta),
            },
          },
        });

        if (currentPayment.budget_id) {
          await tx.monthlyBudget.update({
            where: { id: currentPayment.budget_id },
            data: {
              remaining_spending_pool: {
                [amountDelta > 0 ? "decrement" : "increment"]: Math.abs(amountDelta),
              },
            },
          });
        }
      }

      return payment;
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    if (error instanceof Error && error.message === "PAYMENT_EXCEEDS_BALANCE") {
      return NextResponse.json({ error: "Payment amount exceeds card balance" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    console.error("Failed to update card payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const payment = await tx.cardPayment.findUnique({
        where: { id },
      });

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      await tx.creditCard.update({
        where: { id: payment.card_id },
        data: {
          statement_balance: {
            increment: payment.amount,
          },
        },
      });

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

      await tx.cardPayment.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    console.error("Failed to delete card payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
