"use client";

import { useTransactions, groupTransactionsByDate } from "@/hooks/useTransactions";
import type { Transaction } from "@/hooks/useTransactions";
import { cn, formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import { useState } from "react";
import TransactionSheet from "./TransactionSheet";

export default function RecentTransactions({ budgetId }: { budgetId: number }) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const { data: transactions, isLoading } = useTransactions(budgetId);

  if (isLoading) return <div className="p-8 text-center"><span className="loading loading-spinner text-primary"></span></div>;

  if (!transactions || transactions.length === 0) {
    return (
      <div className="finance-card p-8 text-center text-gray-400">
        <p className="text-sm">ยังไม่มีรายการในเดือนนี้</p>
      </div>
    );
  }

  const handleEdit = (t: Transaction) => {
    setSelectedTransaction(t);
    setIsSheetOpen(true);
  };

  const grouped = groupTransactionsByDate(transactions);

  return (
    <div className="space-y-6">
      {grouped.map(([date, items]) => (
        <div key={date} className="space-y-3">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            {dayjs(date).format("D MMMM YYYY")}
          </h4>
          <div className="space-y-3">
            {items.map((t) => {
              const isCreditCard = !!t.card_id;
              const isIncome = t.category?.name?.includes("รายได้") || t.description?.includes("รายได้");
              
              return (
                <div 
                  key={t.id} 
                  onClick={() => handleEdit(t)}
                  className="finance-card finance-action flex items-center justify-between p-4 hover:bg-base-200/50 cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-xl",
                      isIncome ? "bg-success" : isCreditCard ? "bg-purple-500" : "bg-primary"
                    )} />
                    <div>
                      <p className="text-base font-semibold text-base-content leading-tight">
                        {t.description || t.category?.name || t.card?.name || "ทั่วไป"}
                      </p>
                      {t.description && (t.category?.name || t.card?.name) && (
                        <p className="text-sm font-normal text-base-content/50">
                          {t.category?.name || t.card?.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className={cn(
                    "text-base font-semibold tracking-tight",
                    isIncome ? 'text-success' : isCreditCard ? 'text-purple-600' : 'text-primary'
                  )}>
                    {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                  </p>
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
