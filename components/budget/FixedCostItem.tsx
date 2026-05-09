"use client";

import { FixedCost } from "@/hooks/useFixedCosts";
import { formatCurrency } from "@/lib/utils";
import { Home, Zap, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FixedCostItemProps {
  fixedCost: FixedCost;
  onEdit: (fixedCost: FixedCost) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, isPaid: boolean) => void;
}

export default function FixedCostItem({ fixedCost, onEdit, onDelete, onToggle }: FixedCostItemProps) {
  return (
    <div className="bg-base-100 p-3 rounded-xl border-[0.5px] border-base-300 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/5 p-2 rounded-lg text-primary">
            {fixedCost.name.includes("เช่า") ? <Home size={20} /> : <Zap size={20} />}
          </div>
          <div>
            <h4 className={cn(
              "text-sm font-bold text-base-content leading-tight",
              fixedCost.is_paid && "line-through text-base-content/40"
            )}>
              {fixedCost.name}
            </h4>
            <p className="text-[10px] font-medium text-base-content/40 uppercase tracking-wider">
              ทุกเดือน
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-base-content">
            {formatCurrency(fixedCost.amount)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-base-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(fixedCost)}
            className="btn btn-xs btn-ghost text-base-content/40 hover:text-primary gap-1 px-2"
          >
            <Pencil size={12} />
            <span className="text-[10px] font-bold">แก้ไข</span>
          </button>
          <button
            onClick={() => onDelete(fixedCost.id)}
            className="btn btn-xs btn-ghost text-base-content/20 hover:text-error gap-1 px-2"
          >
            <Trash2 size={12} />
            <span className="text-[10px] font-bold">ลบ</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-bold uppercase",
            fixedCost.is_paid ? "text-success" : "text-base-content/30"
          )}>
            {fixedCost.is_paid ? "จ่ายแล้ว" : "ยังไม่จ่าย"}
          </span>
          <input 
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={fixedCost.is_paid}
            onChange={() => onToggle(fixedCost.id, !fixedCost.is_paid)}
          />
        </div>
      </div>
    </div>
  );
}
