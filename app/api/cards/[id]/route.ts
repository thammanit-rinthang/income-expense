import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  // Update the type to Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await the params object
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    // Validate ID
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, person_name, credit_limit, statement_balance, minimum_payment, due_date } = body;

    const card = await prisma.creditCard.update({
      where: { id },
      data: {
        name,
        person_name,
        credit_limit: credit_limit !== undefined ? parseFloat(credit_limit) : undefined,
        statement_balance: statement_balance !== undefined ? parseFloat(statement_balance) : undefined,
        minimum_payment: minimum_payment !== undefined ? parseFloat(minimum_payment) : undefined,
        due_date: due_date !== undefined ? (due_date ? new Date(due_date) : null) : undefined,
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("Failed to update card:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  // Update the type to Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await the params object
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.creditCard.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete card:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}