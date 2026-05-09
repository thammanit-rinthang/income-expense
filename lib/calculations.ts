import prisma from "./prisma";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * Calculates the remaining spending pool for a monthly budget.
 * Formula: Total Income - Cash Transactions - Paid Fixed Costs - Loan Payments - Card Payments
 */
export async function calculateRemainingPool(budgetId: number) {
  const budget = await prisma.monthlyBudget.findUnique({
    where: { id: budgetId },
    include: {
      transactions: {
        where: { card_id: null },
      },
      fixed_costs: {
        where: { is_paid: true },
      },
      loan_payments: true,
      card_payments: true,
    },
  });

  if (!budget) {
    throw new Error(`Budget with ID ${budgetId} not found`);
  }

  const totalIncome = budget.total_income;

  const cashTransactionsTotal = budget.transactions.reduce(
    (acc: Prisma.Decimal, t: any) => acc.plus(t.amount),
    new Prisma.Decimal(0)
  );

  const paidFixedCostsTotal = budget.fixed_costs.reduce(
    (acc: Prisma.Decimal, f: any) => acc.plus(f.amount),
    new Prisma.Decimal(0)
  );

  const loanPaymentsTotal = budget.loan_payments.reduce(
    (acc: Prisma.Decimal, l: any) => acc.plus(l.amount),
    new Prisma.Decimal(0)
  );

  const cardPaymentsTotal = budget.card_payments.reduce(
    (acc: Prisma.Decimal, c: any) => acc.plus(c.amount),
    new Prisma.Decimal(0)
  );

  const remainingPool = totalIncome
    .minus(cashTransactionsTotal)
    .minus(paidFixedCostsTotal)
    .minus(loanPaymentsTotal)
    .minus(cardPaymentsTotal);

  return remainingPool;
}
