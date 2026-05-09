"use client";

import { formatCurrency } from "@/lib/utils";
import { Category } from "@/hooks/useCategories";
import { FixedCost } from "@/hooks/useFixedCosts";
import { PieChart, CheckCircle2, CircleDollarSign } from "lucide-react";

interface IncomeSummaryProps {
  categories?: Category[];
  fixedCosts?: FixedCost[];
  type: "categories" | "fixed";
}

export default function IncomeSummary({ categories, fixedCosts, type }: IncomeSummaryProps) {
  const stats = type === "categories" 
    ? categories?.reduce((acc, cat) => ({
        total: acc.total + Number(cat.monthly_budget || 0),
        spent: acc.spent + Number(cat.spent || 0),
        remaining: acc.remaining + (Number(cat.monthly_budget || 0) - Number(cat.spent || 0))
      }), { total: 0, spent: 0, remaining: 0 })
    : fixedCosts?.reduce((acc, fixed) => ({
        total: acc.total + Number(fixed.amount || 0),
        spent: acc.spent + (fixed.is_paid ? Number(fixed.amount || 0) : 0),
        remaining: acc.remaining + (!fixed.is_paid ? Number(fixed.amount || 0) : 0)
      }), { total: 0, spent: 0, remaining: 0 });

  const currentStats = stats || { total: 0, spent: 0, remaining: 0 };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 mb-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 flex items-center justify-center bg-primary/5 text-primary rounded-xl">
          {type === "categories" ? <PieChart size={20} /> : <CheckCircle2 size={20} />}
        </div>
        <div>
          <h3 className="text-sm text-gray-900 font-black uppercase tracking-wider leading-none">
            {type === "categories" ? "Expense Categories" : "Fixed Expenses"}
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Monthly Summary</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">ทั้งหมด</p>
          <p className="text-sm text-gray-900 tracking-tight">
            {formatCurrency(currentStats.total)}
          </p>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">ใช้ไป</p>
          <p className="text-sm  text-gray-900 tracking-tight">
            {formatCurrency(currentStats.spent)}
          </p>
        </div>
        <div className="bg-primary/[0.03] p-4 rounded-xl border border-primary/5">
          <p className="text-[10px] text-primary/60 font-bold uppercase mb-1">คงเหลือ</p>
          <p className="text-sm  text-primary tracking-tight">
            {formatCurrency(currentStats.remaining)}
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="w-full bg-gray-50 rounded-xl h-1.5 overflow-hidden border border-gray-100/50">
            <div
              className="h-full bg-primary rounded-xl transition-all duration-1000"
              style={{ 
                width: `${currentStats.total > 0 ? Math.min((currentStats.spent / currentStats.total) * 100, 100) : 0}%` 
              }}
            />
          </div>
        </div>
        <span className="text-[10px]  text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
          {currentStats.total > 0 
            ? Math.round((currentStats.spent / currentStats.total) * 100) 
            : 0}%
        </span>
      </div>
    </div>
  );
}

