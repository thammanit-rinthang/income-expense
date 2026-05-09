import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const loanSchema = z.object({
  name: z.string().min(1),
  person_name: z.string(),
  budget_id: z.number().optional(),
  principal: z.number().positive(),
  interest_rate: z.number().min(0),
  term_months: z.number().positive(),
  include_in_income: z.boolean().default(false),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personName = searchParams.get("person_name");

  try {
    const loans = await prisma.loan.findMany({
      where: personName ? { person_name: personName } : {},
      include: {
        payments: true,
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(loans);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = loanSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          name: validatedData.name,
          person_name: validatedData.person_name,
          budget_id: validatedData.budget_id,
          principal: validatedData.principal,
          interest_rate: validatedData.interest_rate,
          term_months: validatedData.term_months,
          start_date: new Date(),
        },
      });

      if (validatedData.include_in_income && validatedData.budget_id) {
        await tx.monthlyBudget.update({
          where: { id: validatedData.budget_id },
          data: {
            total_income: {
              increment: validatedData.principal,
            },
            remaining_spending_pool: {
              increment: validatedData.principal,
            },
          },
        });
      }

      return loan;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
