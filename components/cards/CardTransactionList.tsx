"use client";

import { useCardTransactions } from "@/hooks/useCards";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

interface CardTransactionListProps {
  cardId: number;
  cardName: string;
  onBack: () => void;
}

export default function CardTransactionList({ cardId, cardName, onBack }: CardTransactionListProps) {
  const { data: transactions, isLoading } = useCardTransactions(cardId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-base-200 rounded-xl transition-colors bg-base-100 border-[0.5px] border-base-300"
        >
          <ArrowLeft size={20} className="text-base-content/60" />
        </button>
        <div>
          <h2 className="text-xl font-black text-base-content">{cardName}</h2>
          <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-widest">รายการใช้จ่ายในรอบบิล</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-base-100 rounded-xl animate-pulse border-[0.5px] border-base-300" />
          ))}
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div className="bg-base-100 rounded-xl border-[0.5px] border-base-300 overflow-hidden">
          {transactions.map((t, index) => (
            <div
              key={t.id}
              className={`p-4 flex items-center justify-between ${
                index !== transactions.length - 1 ? "border-b-[0.5px] border-base-200" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center text-base-content/60">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-base-content">{t.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-base-content/40 font-bold uppercase">
                      {dayjs(t.created_at).format("DD MMM BBBB")}
                    </span>
                    {t.category && (
                      <>
                        <span className="text-base-300">•</span>
                        <span className="text-[9px] bg-base-200 text-base-content/60 px-2 py-0.5 rounded-lg font-black uppercase">
                          {t.category.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-base-content text-lg">
                  {formatCurrency(Number(t.amount))}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-base-100 rounded-xl border border-dashed border-base-300">
          <ShoppingBag className="mx-auto text-base-300 mb-4" size={48} />
          <p className="text-base-content/50 font-medium">ยังไม่มีรายการใช้จ่ายในรอบบิลนี้</p>
        </div>
      )}
    </div>
  );
}
