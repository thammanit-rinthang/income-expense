import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const budgetId = searchParams.get("budget_id");

  if (!budgetId) {
    return NextResponse.json({ error: "budget_id is required" }, { status: 400 });
  }

  try {
    const fixedCosts = await prisma.fixedCost.findMany({
      where: { budget_id: parseInt(budgetId) },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(fixedCosts);
  } catch (error) {
    console.error("Fetch fixed costs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { budget_id, name, amount, is_paid } = body;

    const fixedCost = await prisma.$transaction(async (tx) => {
      const fc = await tx.fixedCost.create({
        data: {
          budget_id: parseInt(budget_id),
          name,
          amount: parseFloat(amount),
          is_paid: is_paid || false,
        },
      });

      if (fc.is_paid) {
        await tx.monthlyBudget.update({
          where: { id: fc.budget_id },
          data: {
            remaining_spending_pool: { decrement: fc.amount },
          },
        });
      }

      return fc;
    });

    return NextResponse.json(fixedCost);
  } catch (error) {
    console.error("Create fixed cost error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, amount, is_paid } = body;

    const result = await prisma.$transaction(async (tx) => {
      // Get current fixed cost state
      const currentFixedCost = await tx.fixedCost.findUnique({
        where: { id: parseInt(id) },
      });

      if (!currentFixedCost) {
        throw new Error("Fixed cost not found");
      }

      // Update fixed cost
      const updatedFixedCost = await tx.fixedCost.update({
        where: { id: parseInt(id) },
        data: {
          name,
          amount: amount !== undefined ? parseFloat(amount) : undefined,
          is_paid: is_paid !== undefined ? is_paid : undefined,
        },
      });

      const wasPaid = currentFixedCost.is_paid;
      const willBePaid = updatedFixedCost.is_paid;
      const oldAmount = Number(currentFixedCost.amount);
      const newAmount = Number(updatedFixedCost.amount);
      let poolAdjustment = 0;

      if (!wasPaid && willBePaid) {
        poolAdjustment = -newAmount;
      } else if (wasPaid && !willBePaid) {
        poolAdjustment = oldAmount;
      } else if (wasPaid && willBePaid && oldAmount !== newAmount) {
        poolAdjustment = oldAmount - newAmount;
      }

      if (poolAdjustment !== 0) {
        await tx.monthlyBudget.update({
          where: { id: updatedFixedCost.budget_id },
          data: {
            remaining_spending_pool: {
              [poolAdjustment > 0 ? "increment" : "decrement"]: Math.abs(poolAdjustment),
            },
          },
        });
      }

      return updatedFixedCost;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update fixed cost error:", error);
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
      const fixedCost = await tx.fixedCost.findUnique({
        where: { id: parseInt(id) },
      });

      if (!fixedCost) {
        throw new Error("Fixed cost not found");
      }

      // If it was paid, refund to pool
      if (fixedCost.is_paid) {
        await tx.monthlyBudget.update({
          where: { id: fixedCost.budget_id },
          data: {
            remaining_spending_pool: {
              increment: fixedCost.amount,
            },
          },
        });
      }

      await tx.fixedCost.delete({
        where: { id: parseInt(id) },
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete fixed cost error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
