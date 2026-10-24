"use client";

import { useTransactions, groupTransactionsByDate } from "@/hooks/useTransactions";
import type { Transaction } from "@/hooks/useTransactions";
import { cn, formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import { useState } from "react";
import TransactionSheet from "./TransactionSheet";
import { CreditCard, Receipt, TrendingUp } from "lucide-react";

export default function RecentTransactions({ budgetId }: { budgetId: number }) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: transactions, isLoading } = useTransactions(budgetId);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <span className="loading loading-spinner text-primary loading-sm"></span>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 text-center text-base-content/40 bg-base-100 rounded-xl border border-dashed border-base-300">
        <p className="text-sm">ยังไม่มีรายการใช้จ่ายในรอบนี้</p>
      </div>
    );
  }

  const handleEdit = (t: Transaction) => {
    setSelectedTransaction(t);
    setIsSheetOpen(true);
  };

  const grouped = groupTransactionsByDate(transactions.slice(0, 15));

  return (
    <div className="space-y-4">
      {grouped.map(([date, items]) => (
        <div key={date} className="space-y-1.5">
          <div className="px-1 text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
            {dayjs(date).format("D MMMM YYYY")}
          </div>

          <div className="bg-base-100 rounded-xl border border-base-300 divide-y divide-base-200 overflow-hidden">
            {items.map((t) => {
              const isCreditCard = Boolean(t.card_id);
              const isIncome =
                t.category?.name?.includes("รายได้") ||
                t.description?.includes("รายได้");

              return (
                <div
                  key={t.id}
                  onClick={() => handleEdit(t)}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-base-200/50 transition-colors cursor-pointer group active:bg-base-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        isIncome
                          ? "bg-success/10 text-success"
                          : isCreditCard
                          ? "bg-purple-500/10 text-purple-600"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {isIncome ? (
                        <TrendingUp size={16} />
                      ) : isCreditCard ? (
                        <CreditCard size={16} />
                      ) : (
                        <Receipt size={16} />
                      )}
                    </div>

                    <div className="truncate">
                      <p className="text-sm font-semibold text-base-content truncate group-hover:text-primary transition-colors">
                        {t.description || t.category?.name || t.card?.name || "รายการทั่วไป"}
                      </p>
                      <p className="text-xs text-base-content/50 truncate">
                        {t.category?.name || t.card?.name || (isCreditCard ? "บัตรเครดิต" : "เงินสด")}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "tabular-nums text-sm font-bold shrink-0 ml-3",
                      isIncome
                        ? "text-success"
                        : isCreditCard
                        ? "text-purple-600"
                        : "text-error"
                    )}
                  >
                    {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <TransactionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        budgetId={budgetId}
        transaction={selectedTransaction}
      />
    </div>
  );
}
