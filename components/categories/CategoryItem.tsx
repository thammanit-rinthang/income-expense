"use client";

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Receipt } from "lucide-react";

interface CategoryItemProps {
  name: string;
  spent: number;
  budget: number | null;
  onClick?: () => void;
}

export default function CategoryItem({ name, spent, budget, onClick }: CategoryItemProps) {
  const percentage = budget ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = budget ? spent > budget : false;

  return (
    <div 
      onClick={onClick}
      className="finance-card p-4 space-y-3 active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="bg-base-200 p-2.5 rounded-xl text-base-content/60">
            <Receipt size={20} />
          </div>
          <div>
            <h4 className="text-base font-bold text-base-content">{name}</h4>
            <p className="text-sm font-normal text-base-content/50">
              {budget ? `ตั้งไว้ ${formatCurrency(budget)}` : "ยังไม่ได้ตั้งงบ"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-base font-semibold", isOverBudget ? "text-error" : "text-base-content")}>
            {formatCurrency(spent)}
          </p>
          {budget && (
            <p className="text-[10px] text-gray-400">
              ใช้ไป {((spent / budget) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      {budget && (
        <div className="w-full bg-base-200 rounded-xl h-2 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-xl transition-all duration-500",
              isOverBudget ? "bg-error" : "bg-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
