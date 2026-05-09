"use client";

import { useUIStore } from "@/store/uiStore";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import TransactionSheet from "./TransactionSheet";

export default function GlobalTransactionSheet() {
  const { isTransactionSheetOpen, closeTransactionSheet } = useUIStore();
  const { data: budget } = useMonthlyBudget();

  if (!budget) return null;

  return (
    <TransactionSheet
      isOpen={isTransactionSheetOpen}
      onClose={closeTransactionSheet}
      budgetId={budget.id}
    />
  );
}
