import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { card_id, amount, note, paid_at, budget_id } = body;

    // Use a transaction to create the payment and update the card balance
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.cardPayment.create({
        data: {
          card_id: parseInt(card_id),
          amount: parseFloat(amount),
          note: note || "",
          paid_at: paid_at ? new Date(paid_at) : new Date(),
          budget_id: budget_id ? parseInt(budget_id) : null,
        },
      });

      // Update the card's statement balance
      const updatedCard = await tx.creditCard.update({
        where: { id: parseInt(card_id) },
        data: {
          statement_balance: {
            decrement: parseFloat(amount),
          },
        },
      });

      return { payment, updatedCard };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to record card payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
