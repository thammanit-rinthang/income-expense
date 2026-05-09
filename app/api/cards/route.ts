import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cards = await prisma.creditCard.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
    return NextResponse.json(cards);
  } catch (error) {
    console.error("Failed to fetch cards:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, person_name, credit_limit, statement_balance, minimum_payment, due_date } = body;

    const card = await prisma.creditCard.create({
      data: {
        name,
        person_name,
        credit_limit: parseFloat(credit_limit),
        statement_balance: parseFloat(statement_balance || 0),
        minimum_payment: parseFloat(minimum_payment || 0),
        due_date: due_date ? new Date(due_date) : null,
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("Failed to create card:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
