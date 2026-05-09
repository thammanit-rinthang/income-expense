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

export default function CardList({ cards, onCardClick, onEditClick, onPaymentClick }: CardListProps) {
  return (
    <>
      {cards.map((card) => {
        const usagePercent = Math.min((card.statement_balance / card.credit_limit) * 100, 100);
        
        return (
          <div
            key={card.id}
            className="bg-white p-5 rounded-xl border border-gray-100 space-y-4 transition-all cursor-pointer"
            onClick={() => onCardClick(card)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                  <CardIcon size={24} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900">{card.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {card.person_name || "บัญชีหลัก"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(card);
                  }}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
                >
                  <Pencil size={18} />
                </button>
                <ChevronRight size={24} className="text-gray-200" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-400 uppercase tracking-tight">การใช้งาน</span>
                <span className={cn(
                  usagePercent > 90 ? "text-red-500" : usagePercent > 70 ? "text-amber-500" : "text-blue-500"
                )}>
                  {usagePercent.toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-50 rounded-xl h-3 overflow-hidden border border-gray-100">
                <div
                  className={cn(
                    "h-full rounded-xl transition-all duration-1000",
                    usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-blue-500"
                  )}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-black text-gray-400 px-1 uppercase tracking-wider">
                <span>ยอดคงเหลือ: {formatCurrency(card.statement_balance)}</span>
                <span>วงเงิน: {formatCurrency(card.credit_limit)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPaymentClick(card);
                }}
                className="btn btn-sm btn-outline btn-primary w-full rounded-xl font-bold text-xs"
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
