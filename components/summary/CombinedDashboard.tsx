"use client";

import { useMonthlySummary } from "@/hooks/useMonthlySummary";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Landmark, Users } from "lucide-react";

export default function CombinedDashboard() {
  const { data, isLoading } = useMonthlySummary();

  if (isLoading) {
    return (
      <div className="flex justify-center p-16">
        <span className="loading loading-spinner text-primary loading-sm"></span>
      </div>
    );
  }

  if (!data) return null;

  const { summary, bon, ray } = data;

  const combinedIncome = Number(summary.combined_income || 0);
  const bonPercent =
    combinedIncome > 0
      ? Math.min((Number(summary.person_a_spent) / combinedIncome) * 100, 100)
      : 0;
  const rayPercent =
    combinedIncome > 0
      ? Math.min((Number(summary.person_b_spent) / combinedIncome) * 100, 100)
      : 0;

  const totalRemaining = Number(bon.remaining) + Number(ray.remaining);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center gap-2 px-1">
        <Users size={18} className="text-primary" />
        <h2 className="text-base font-bold text-base-content">ภาพรวมงบครอบครัว (Bon & Ray)</h2>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Combined Hero Card */}
          <section className="p-6 sm:p-8 rounded-2xl bg-base-100 border border-base-300 space-y-5">
            <div>
              <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block mb-1">
                เงินคงเหลือรวมสองคน
              </span>
              <div className="tabular-nums font-black text-4xl sm:text-5xl text-base-content tracking-tight">
                {formatCurrency(totalRemaining)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-base-200">
              <div className="bg-base-200/50 p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-base-content/50 uppercase block mb-1">
                  Bon เหลือใช้
                </span>
                <span className="tabular-nums font-bold text-base sm:text-lg text-primary block">
                  {formatCurrency(bon.remaining)}
                </span>
              </div>
              <div className="bg-base-200/50 p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-base-content/50 uppercase block mb-1">
                  Ray เหลือใช้
                </span>
                <span className="tabular-nums font-bold text-base sm:text-lg text-primary block">
                  {formatCurrency(ray.remaining)}
                </span>
              </div>
            </div>
          </section>

          {/* Comparison Progress Card */}
          <section className="p-6 rounded-2xl bg-base-100 border border-base-300 space-y-5">
            <h3 className="font-bold text-sm text-base-content">สัดส่วนการใช้จริงเทียบรายรับรวม</h3>

            <div className="space-y-4">
              {/* Bon */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-base-content">Bon ({bonPercent.toFixed(1)}%)</span>
                  <span className="tabular-nums text-base-content/60">
                    {formatCurrency(summary.person_a_spent)}
                  </span>
                </div>
                <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${bonPercent}%` }}
                  />
                </div>
              </div>

              {/* Ray */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-base-content">Ray ({rayPercent.toFixed(1)}%)</span>
                  <span className="tabular-nums text-base-content/60">
                    {formatCurrency(summary.person_b_spent)}
                  </span>
                </div>
                <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-base-content/60 rounded-full transition-all duration-500"
                    style={{ width: `${rayPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Secondary Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 flex items-center gap-4">
            <div className="p-2.5 bg-success/10 text-success rounded-xl">
              <Wallet size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block mb-0.5">
                รายรับรวมสองคน
              </span>
              <p className="tabular-nums text-lg font-black text-base-content">
                {formatCurrency(summary.combined_income)}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 flex items-center gap-4">
            <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
              <Landmark size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block mb-0.5">
                จ่ายประจำที่ชำระแล้ว
              </span>
              <p className="tabular-nums text-lg font-black text-base-content">
                {formatCurrency(summary.combined_fixed)}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 space-y-3">
            <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block">
              สรุปรายบุคคล
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-base-200">
                <span className="text-base-content/60">Bon ใช้จ่ายจริง:</span>
                <span className="tabular-nums font-bold text-base-content">
                  {formatCurrency(summary.person_a_spent)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-base-content/60">Ray ใช้จ่ายจริง:</span>
                <span className="tabular-nums font-bold text-base-content">
                  {formatCurrency(summary.person_b_spent)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
