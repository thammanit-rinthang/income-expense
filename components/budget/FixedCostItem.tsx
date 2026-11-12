"use client";

import { FixedCost } from "@/hooks/useFixedCosts";
import { formatCurrency, cn } from "@/lib/utils";
import { Home, Zap, Pencil, Trash2, Check } from "lucide-react";
import dayjs from "dayjs";

interface FixedCostItemProps {
  fixedCost: FixedCost;
  onEdit: (fixedCost: FixedCost) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, isPaid: boolean) => void;
}

export default function FixedCostItem({
  fixedCost,
  onEdit,
  onDelete,
  onToggle,
}: FixedCostItemProps) {
  return (
    <div className="p-4 rounded-xl bg-base-100 border border-base-300 space-y-3 transition-all hover:border-primary/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-base-200 text-base-content/60 flex items-center justify-center shrink-0">
            {fixedCost.name.includes("เช่า") ? <Home size={16} /> : <Zap size={16} />}
          </div>
          <div className="truncate">
            <h4
              className={cn(
                "text-sm font-semibold text-base-content truncate",
                fixedCost.is_paid && "line-through text-base-content/40"
              )}
            >
              {fixedCost.name}
            </h4>
            <span className="text-[10px] text-base-content/40 uppercase tracking-wider block">
              {fixedCost.due_date
                ? `ครบกำหนดวันที่ ${dayjs(fixedCost.due_date).date()}`
                : "รายเดือน · ยังไม่กำหนดวันจ่าย"}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 ml-3">
          <p className="tabular-nums text-sm font-bold text-base-content">
            {formatCurrency(fixedCost.amount)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-base-200 text-xs">
        {/* Toggle Paid State */}
        <button
          onClick={() => onToggle(fixedCost.id, !fixedCost.is_paid)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
            fixedCost.is_paid
              ? "bg-success/10 text-success"
              : "bg-base-200 text-base-content/60 hover:text-base-content"
          )}
        >
          {fixedCost.is_paid && <Check size={13} strokeWidth={2.5} />}
          <span>{fixedCost.is_paid ? "ชำระแล้ว" : "ยังไม่จ่าย"}</span>
        </button>

        {/* Edit and Delete Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(fixedCost)}
            aria-label="แก้ไข"
            className="min-h-11 min-w-11 rounded-lg text-base-content/55 hover:text-base-content hover:bg-base-200 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(fixedCost.id)}
            aria-label="ลบ"
            className="min-h-11 min-w-11 rounded-lg text-base-content/55 hover:text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
