"use client";

import { CreditCard } from "@/hooks/useCards";
import { CreditCard as CardIcon, ChevronRight, Pencil } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface CardListProps {
  cards: CreditCard[];
  onCardClick: (card: CreditCard) => void;
  onEditClick: (card: CreditCard) => void;
  onPaymentClick: (card: CreditCard) => void;
}

export default function CardList({
  cards,
  onCardClick,
  onEditClick,
  onPaymentClick,
}: CardListProps) {
  return (
    <>
      {cards.map((card) => {
        const usagePercent = Math.min(
          (card.statement_balance / card.credit_limit) * 100,
          100
        );

        return (
          <div
            key={card.id}
            className="bg-base-100 p-5 rounded-xl border border-base-300 space-y-4 hover:border-primary/40 transition-all cursor-pointer group select-none"
            onClick={() => onCardClick(card)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-base-200 text-base-content/70 flex items-center justify-center shrink-0">
                  <CardIcon size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors">
                    {card.name}
                  </h4>
                  <p className="text-[10px] text-base-content/40 uppercase tracking-wider font-semibold">
                    {card.person_name || "บัญชีหลัก"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(card);
                  }}
                  aria-label="แก้ไขข้อมูลบัตร"
                  className="p-1.5 hover:bg-base-200 rounded-lg text-base-content/40 hover:text-base-content transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <ChevronRight size={18} className="text-base-content/30 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-base-content/50">การใช้วงเงิน</span>
                <span
                  className={cn(
                    "tabular-nums font-bold",
                    usagePercent > 80
                      ? "text-error"
                      : usagePercent > 60
                      ? "text-warning"
                      : "text-base-content"
                  )}
                >
                  {usagePercent.toFixed(1)}%
                </span>
              </div>

              <div className="w-full bg-base-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    usagePercent > 80
                      ? "bg-error"
                      : usagePercent > 60
                      ? "bg-warning"
                      : "bg-primary"
                  )}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-base-content/50 pt-1 tabular-nums">
                <span>ยอดเรียกเก็บ: <strong className="text-base-content">{formatCurrency(card.statement_balance)}</strong></span>
                <span>วงเงิน: {formatCurrency(card.credit_limit)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-base-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPaymentClick(card);
                }}
                className="w-full py-2 px-3 rounded-lg bg-base-200 hover:bg-primary hover:text-primary-content text-xs font-bold text-base-content transition-all"
              >
                ชำระยอดบัตร
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
