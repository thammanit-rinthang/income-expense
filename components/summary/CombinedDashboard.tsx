"use client";

import { useMonthlySummary } from "@/hooks/useMonthlySummary";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Landmark, ReceiptText } from "lucide-react";

export default function CombinedDashboard() {
  const { data, isLoading } = useMonthlySummary();

  if (isLoading) return <div className="flex justify-center p-12"><span className="loading loading-spinner text-primary"></span></div>;
  if (!data) return null;

  const { summary, bon, ray } = data;

  return (
    <div className="space-y-8">
      {/* Combined Stats */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-primary p-6 rounded-xl text-primary-content">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-1">Combined Remaining Pool</p>
          <p className="text-4xl font-black">
            {formatCurrency(Number(bon.remaining) + Number(ray.remaining))}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-success/10 text-success rounded-xl"><Wallet size={20} /></div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Income</p>
              <p className="font-black text-gray-900">{formatCurrency(summary.combined_income)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-warning/10 text-warning rounded-xl"><Landmark size={20} /></div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Fixed</p>
              <p className="font-black text-gray-900">{formatCurrency(summary.combined_fixed)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart (Simple Bar) */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6">
        <div className="flex items-center gap-2 px-1">
          <ReceiptText size={20} className="text-primary" />
          <h3 className="font-black text-gray-900 uppercase tracking-tight">Spending Comparison</h3>
        </div>

        <div className="space-y-6">
          {/* Bon */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-900">Bon</span>
              <span className="text-gray-500">{formatCurrency(summary.person_a_spent)}</span>
            </div>
            <div className="w-full bg-gray-50 rounded-xl h-4 overflow-hidden border border-gray-100 p-0.5">
              <div
                className="h-full bg-primary rounded-xl transition-all duration-1000"
                style={{ width: `${(summary.person_a_spent / summary.combined_income) * 100}%` }}
              />
            </div>
          </div>

          {/* Ray */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-900">Ray</span>
              <span className="text-gray-500">{formatCurrency(summary.person_b_spent)}</span>
            </div>
            <div className="w-full bg-gray-50 rounded-xl h-4 overflow-hidden border border-gray-100 p-0.5">
              <div
                className="h-full bg-secondary rounded-xl transition-all duration-1000"
                style={{ width: `${(summary.person_b_spent / summary.combined_income) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Individual Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Bon Remaining</p>
          <p className="font-black text-primary">{formatCurrency(bon.remaining)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Ray Remaining</p>
          <p className="font-black text-secondary">{formatCurrency(ray.remaining)}</p>
        </div>
      </div>
    </div>
  );
}
