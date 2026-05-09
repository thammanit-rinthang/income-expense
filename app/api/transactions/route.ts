import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const transactionSchema = z.object({
  budget_id: z.number(),
  category_id: z.number().nullable().optional(),
  card_id: z.number().nullable().optional(),
  amount: z.number().positive(),
  description: z.string().min(1),
  created_at: z.string().optional().nullable(),
}).refine(data => data.category_id != null || data.card_id != null, {
  message: "Must have either a category or a credit card",
  path: ["category_id", "card_id"],
});

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
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
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
      } else if (validatedData.category_id) {
        // Path A: Cash/Transfer
        const category = await tx.budgetCategory.findUnique({
          where: { id: validatedData.category_id },
          select: { monthly_budget: true },
        });

        const hasAllocation = category?.monthly_budget && Number(category.monthly_budget) > 0;

        if (!hasAllocation) {
          await tx.monthlyBudget.update({
            where: { id: validatedData.budget_id },
            data: {
              remaining_spending_pool: {
                decrement: validatedData.amount,
              },
            },
          });
        }
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
      } else if (oldTx.category_id && oldTx.budget_id) {
        const oldCat = await tx.budgetCategory.findUnique({
          where: { id: oldTx.category_id },
          select: { monthly_budget: true },
        });
        const hadAllocation = oldCat?.monthly_budget && Number(oldCat.monthly_budget) > 0;
        
        if (!hadAllocation) {
          await tx.monthlyBudget.update({
            where: { id: oldTx.budget_id },
            data: { remaining_spending_pool: { increment: oldTx.amount } },
          });
        }
      }

      // 3. Update transaction
      const updatedTx = await tx.transaction.update({
        where: { id: parseInt(id) },
        data: {
          amount: amount !== undefined ? parseFloat(amount) : undefined,
          description: description !== undefined ? description : undefined,
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
      } else if (updatedTx.category_id && updatedTx.budget_id) {
        const newCat = await tx.budgetCategory.findUnique({
          where: { id: updatedTx.category_id },
          select: { monthly_budget: true },
        });
        const hasAllocation = newCat?.monthly_budget && Number(newCat.monthly_budget) > 0;

        if (!hasAllocation) {
          await tx.monthlyBudget.update({
            where: { id: updatedTx.budget_id },
            data: { remaining_spending_pool: { decrement: updatedTx.amount } },
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
      } else if (transaction.category_id && transaction.budget_id) {
        const cat = await tx.budgetCategory.findUnique({
          where: { id: transaction.category_id },
          select: { monthly_budget: true },
        });
        const hadAllocation = cat?.monthly_budget && Number(cat.monthly_budget) > 0;

        if (!hadAllocation) {
          await tx.monthlyBudget.update({
            where: { id: transaction.budget_id },
            data: { remaining_spending_pool: { increment: transaction.amount } },
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
