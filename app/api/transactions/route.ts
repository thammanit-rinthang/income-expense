import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";

const transactionSchema = z.object({
  budget_id: z.number(),
  category_id: z.number().nullable().optional(),
  card_id: z.number().nullable().optional(),
  amount: z.number().positive(),
  description: z.string().optional().nullable().transform(val => val || ""),
  created_at: z.string().optional().nullable(),
});

// Helper to calculate excess amount for a cash transaction being applied
async function calculateExcessToApply(
  tx: Prisma.TransactionClient,
  budgetId: number,
  categoryId: number,
  amount: number,
  txIdToExclude?: number
) {
  const category = await tx.budgetCategory.findUnique({
    where: { id: categoryId },
    select: { monthly_budget: true },
  });

  const categoryBudget = Number(category?.monthly_budget || 0);
  if (categoryBudget <= 0) {
    // If no allocation, the entire amount is deducted from the unallocated pool
    return amount;
  }

  // Get total spent in this category so far (only cash/transfer counts against category budget)
  const spentResult = await tx.transaction.aggregate({
    where: { 
      budget_id: budgetId,
      category_id: categoryId,
      card_id: null,
      ...(txIdToExclude ? { id: { not: txIdToExclude } } : {}),
    },
    _sum: { amount: true }
  });
  const spentBefore = Number(spentResult._sum.amount || 0);

  if (spentBefore >= categoryBudget) {
    // Already over budget, so the entire new amount is excess
    return amount;
  } else {
    const available = categoryBudget - spentBefore;
    if (amount > available) {
      return amount - available;
    }
    return 0;
  }
}

// Helper to calculate excess amount to refund when a cash transaction is deleted/reverted
async function calculateExcessToRevert(
  tx: Prisma.TransactionClient,
  budgetId: number,
  categoryId: number,
  amount: number,
  txIdToExclude: number
) {
  const category = await tx.budgetCategory.findUnique({
    where: { id: categoryId },
    select: { monthly_budget: true },
  });

  const categoryBudget = Number(category?.monthly_budget || 0);
  if (categoryBudget <= 0) {
    // If no allocation, the entire amount is refunded
    return amount;
  }

  // Get total spent in this category *excluding* the transaction being reverted
  const spentResult = await tx.transaction.aggregate({
    where: { 
      budget_id: budgetId,
      category_id: categoryId,
      card_id: null,
      id: { not: txIdToExclude }
    },
    _sum: { amount: true }
  });
  const spentBefore = Number(spentResult._sum.amount || 0);
  const spentWith = spentBefore + amount;

  if (spentWith <= categoryBudget) {
    // No excess was reached with this transaction
    return 0;
  } else {
    // Calculate how much excess this transaction contributed
    const totalExcess = spentWith - categoryBudget;
    return Math.min(amount, totalExcess);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const budgetId = searchParams.get("budget_id");

  if (!budgetId) {
    return NextResponse.json({ error: "budget_id is required" }, { status: 400 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { budget_id: parseInt(budgetId) },
      orderBy: { created_at: "desc" },
      include: {
        category: true,
        card: true,
      },
    });

    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      let deductAmount = 0;
      if (validatedData.card_id) {
        // Path B: Credit Card
        await tx.creditCard.update({
          where: { id: validatedData.card_id },
          data: {
            statement_balance: {
              increment: validatedData.amount,
            },
          },
        });
      } else {
        // Path A: Cash/Transfer (card_id is null)
        deductAmount = validatedData.amount;
        if (validatedData.category_id) {
          deductAmount = await calculateExcessToApply(tx, validatedData.budget_id, validatedData.category_id, validatedData.amount);
        }
      }

      // Create the transaction after calculating category excess, so the new row
      // is not accidentally counted as previous spending.
      const transaction = await tx.transaction.create({
        data: {
          budget_id: validatedData.budget_id,
          category_id: validatedData.category_id,
          card_id: validatedData.card_id,
          amount: validatedData.amount,
          description: validatedData.description,
          created_at: validatedData.created_at ? new Date(validatedData.created_at) : undefined,
        },
      });

      if (!validatedData.card_id && deductAmount > 0) {
        await tx.monthlyBudget.update({
          where: { id: validatedData.budget_id },
          data: {
            remaining_spending_pool: {
              decrement: deductAmount,
            },
          },
        });
      }

      return transaction;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error }, { status: 400 });
    }
    console.error("Transaction error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, amount, description, category_id, card_id, created_at } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get old transaction
      const oldTx = await tx.transaction.findUnique({
        where: { id: parseInt(id) },
      });

      if (!oldTx) {
        throw new Error("Transaction not found");
      }

      // 2. Revert old balance effect
      if (oldTx.card_id) {
        await tx.creditCard.update({
          where: { id: oldTx.card_id },
          data: { statement_balance: { decrement: oldTx.amount } },
        });
      } else if (oldTx.budget_id) {
        // Revert Cash/Transfer
        let refundAmount = Number(oldTx.amount);
        if (oldTx.category_id) {
          refundAmount = await calculateExcessToRevert(tx, oldTx.budget_id, oldTx.category_id, Number(oldTx.amount), oldTx.id);
        }

        if (refundAmount > 0) {
          await tx.monthlyBudget.update({
            where: { id: oldTx.budget_id },
            data: { 
              remaining_spending_pool: { increment: refundAmount } 
            },
          });
        }
      }

      // 3. Update transaction
      const updatedTx = await tx.transaction.update({
        where: { id: parseInt(id) },
        data: {
          amount: amount !== undefined ? parseFloat(amount) : undefined,
          description: description !== undefined ? (description ?? "") : undefined,
          category_id: category_id !== undefined ? (category_id === null ? null : Number(category_id)) : undefined,
          card_id: card_id !== undefined ? (card_id === null ? null : Number(card_id)) : undefined,
          created_at: created_at ? new Date(created_at) : undefined,
        },
      });

      // 4. Apply new balance effect
      if (updatedTx.card_id) {
        await tx.creditCard.update({
          where: { id: updatedTx.card_id },
          data: { statement_balance: { increment: updatedTx.amount } },
        });
      } else if (updatedTx.budget_id) {
        // Apply new Cash/Transfer
        let deductAmount = Number(updatedTx.amount);
        if (updatedTx.category_id) {
          deductAmount = await calculateExcessToApply(tx, updatedTx.budget_id, updatedTx.category_id, Number(updatedTx.amount), updatedTx.id);
        }

        if (deductAmount > 0) {
          await tx.monthlyBudget.update({
            where: { id: updatedTx.budget_id },
            data: { 
              remaining_spending_pool: { decrement: deductAmount } 
            },
          });
        }
      }

      return updatedTx;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update transaction error:", error);
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

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: parseInt(id) },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Refund balance
      if (transaction.card_id) {
        await tx.creditCard.update({
          where: { id: transaction.card_id },
          data: { statement_balance: { decrement: transaction.amount } },
        });
      } else if (transaction.budget_id) {
        // Refund Cash/Transfer
        let refundAmount = Number(transaction.amount);
        if (transaction.category_id) {
          refundAmount = await calculateExcessToRevert(tx, transaction.budget_id, transaction.category_id, Number(transaction.amount), transaction.id);
        }

        if (refundAmount > 0) {
          await tx.monthlyBudget.update({
            where: { id: transaction.budget_id },
            data: { 
              remaining_spending_pool: { increment: refundAmount } 
            },
          });
        }
      }

      await tx.transaction.delete({
        where: { id: parseInt(id) },
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
