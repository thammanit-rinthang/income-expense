"use client";

import { formatCurrency, cn } from "@/lib/utils";

interface CategoryItemProps {
  name: string;
  spent: number;
  budget: number | null;
  onClick?: () => void;
}

export default function CategoryItem({ name, spent, budget, onClick }: CategoryItemProps) {
  const percentage = budget ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = budget ? spent > budget : false;
  const remaining = budget ? budget - spent : null;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="p-4 rounded-xl bg-base-100 border border-base-300 hover:border-primary/40 transition-all cursor-pointer group active:scale-[0.99] select-none"
    >
      <div className="flex justify-between items-baseline mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-base-content group-hover:text-primary transition-colors">
            {name}
          </span>
          {budget && (
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-md tabular-nums",
                isOverBudget
                  ? "bg-error/10 text-error font-bold"
                  : percentage >= 80
                  ? "bg-warning/10 text-warning"
                  : "bg-base-200 text-base-content/60"
              )}
            >
              {((spent / budget) * 100).toFixed(0)}%
            </span>
          )}
        </div>

        <div className="text-right">
          <span className={cn("tabular-nums text-sm font-bold", isOverBudget ? "text-error" : "text-base-content")}>
            {formatCurrency(spent)}
          </span>
          {budget && (
            <span className="tabular-nums text-xs text-base-content/40 ml-1">
              / {formatCurrency(budget)}
            </span>
          )}
        </div>
      </div>

      {budget && (
        <div className="space-y-1.5">
          <div className="w-full bg-base-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isOverBudget ? "bg-error" : percentage >= 80 ? "bg-warning" : "bg-primary"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {remaining !== null && (
            <div className="flex justify-between text-[11px] text-base-content/50">
              <span>{isOverBudget ? "เกินงบแล้ว" : "งบคงเหลือ"}</span>
              <span className={cn("tabular-nums font-medium", isOverBudget ? "text-error font-bold" : "text-base-content/70")}>
                {isOverBudget ? `+${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
