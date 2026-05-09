"use client";

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ReceiptRussianRuble } from "lucide-react";

interface LoanItemProps {
  name: string;
  principal: number;
  paid: number;
  onPay: () => void;
}

export default function LoanItem({ name, principal, paid, onPay }: LoanItemProps) {
  const percentage = Math.min((paid / principal) * 100, 100);
  const remaining = principal - paid;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl">
            <ReceiptRussianRuble size={24} />
          </div>
          <div>
            <h4 className="font-black text-gray-900">{name}</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Remaining: {formatCurrency(remaining)}
            </p>
          </div>
        </div>
        <button 
          onClick={onPay}
          className="btn btn-sm btn-outline btn-secondary rounded-xl px-4 text-xs font-bold"
        >
          Pay Now
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-gray-400 uppercase tracking-tight">Progress</span>
          <span className="text-secondary">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-50 rounded-xl h-3 overflow-hidden border border-gray-100">
          <div
            className="h-full bg-secondary rounded-xl transition-all duration-1000"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-black text-gray-400 px-1 uppercase">
          <span>Paid {formatCurrency(paid)}</span>
          <span>Target {formatCurrency(principal)}</span>
        </div>
      </div>
    </div>
  );
}
