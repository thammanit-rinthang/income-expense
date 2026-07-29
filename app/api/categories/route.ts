import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const categorySchema = z.object({
  id: z.number().optional(),
  budget_id: z.number(),
  name: z.string().min(1),
  monthly_budget: z.number().nullable().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const budgetId = searchParams.get("budget_id");

  if (!budgetId) {
    return NextResponse.json({ error: "budget_id is required" }, { status: 400 });
  }

  try {
    const categories = await prisma.budgetCategory.findMany({
      where: { budget_id: parseInt(budgetId) },
      include: {
        transactions: {
          select: { amount: true }
        }
      }
    });

    const categoriesWithSpent = categories.map((cat) => ({
      ...cat,
      spent: cat.transactions.reduce((acc, t) => acc + Number(t.amount), 0),
      transactions: undefined // Remove detailed transactions from response
    }));

    return NextResponse.json(categoriesWithSpent);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      if (validatedData.id) {
        // Get current category state
        const currentCategory = await tx.budgetCategory.findUnique({
          where: { id: validatedData.id },
        });

        if (!currentCategory) {
          throw new Error("Category not found");
        }

        // Update
        const category = await tx.budgetCategory.update({
          where: { id: validatedData.id },
          data: {
            name: validatedData.name,
            monthly_budget: validatedData.monthly_budget ?? null,
          },
        });

        // Update pool based on difference in monthly_budget
        const oldBudget = Number(currentCategory.monthly_budget || 0);
        const newBudget = Number(validatedData.monthly_budget || 0);
        const spentResult = await tx.transaction.aggregate({
          where: {
            budget_id: category.budget_id,
            category_id: category.id,
            card_id: null,
          },
          _sum: { amount: true },
        });
        const spent = Number(spentResult._sum.amount || 0);
        const oldExcess = Math.max(spent - oldBudget, 0);
        const newExcess = Math.max(spent - newBudget, 0);
        const poolAdjustment = -(newBudget - oldBudget) - (newExcess - oldExcess);

        if (poolAdjustment !== 0) {
          await tx.monthlyBudget.update({
            where: { id: category.budget_id },
            data: {
              remaining_spending_pool: {
                [poolAdjustment > 0 ? "increment" : "decrement"]: Math.abs(poolAdjustment),
              },
            },
          });
        }

        return category;
      } else {
        // Create
        const category = await tx.budgetCategory.create({
          data: {
            budget_id: validatedData.budget_id,
            name: validatedData.name,
            monthly_budget: validatedData.monthly_budget ?? null,
          },
        });

        // Deduct full amount from pool
        const budgetAmount = Number(validatedData.monthly_budget || 0);
        if (budgetAmount !== 0) {
          await tx.monthlyBudget.update({
            where: { id: category.budget_id },
            data: {
              remaining_spending_pool: {
                decrement: budgetAmount,
              },
            },
          });
        }

        return category;
      }
    });

    return NextResponse.json(result, { status: validatedData.id ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error }, { status: 400 });
    }
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
      const category = await tx.budgetCategory.findUnique({
        where: { id: parseInt(id) },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      const spentResult = await tx.transaction.aggregate({
        where: {
          budget_id: category.budget_id,
          category_id: category.id,
          card_id: null,
        },
        _sum: { amount: true },
      });

      // Deleting a category turns its transactions into unallocated spending.
      // Refund only the unused part of the allocation.
      const refundAmount = Math.max(Number(category.monthly_budget || 0) - Number(spentResult._sum.amount || 0), 0);
      if (refundAmount !== 0) {
        await tx.monthlyBudget.update({
          where: { id: category.budget_id },
          data: {
            remaining_spending_pool: {
              increment: refundAmount,
            },
          },
        });
      }

      await tx.budgetCategory.delete({
        where: { id: parseInt(id) },
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
